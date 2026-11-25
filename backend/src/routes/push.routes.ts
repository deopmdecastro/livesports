import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { pushConfig, safePushEndpoint } from '../lib/push';
const router = Router();
const prefsSchema = z.object({ announcements:z.boolean(), goals:z.boolean(), cards:z.boolean().optional().default(false), matchStart:z.boolean(), daily:z.boolean(), eventIds:z.array(z.string().min(1).max(150)).max(100) }).strict();
router.get('/config', (_req,res) => res.json({success:true,data:pushConfig()}));
router.use(authenticateToken);
router.get('/preferences', async(req:AuthRequest,res,next)=>{ try {
  const rows=await prisma.$queryRawUnsafe<any[]>('SELECT * FROM notification_preferences WHERE user_id=$1',req.user!.id); const p=rows[0];
  res.json({success:true,data:p?{announcements:p.announcements,goals:p.goals,cards:p.cards,matchStart:p.match_start,daily:p.daily,eventIds:p.event_ids}:{announcements:true,goals:true,cards:false,matchStart:true,daily:false,eventIds:[]}});
} catch(e){next(e)} });
router.get('/following', async(req:AuthRequest,res,next)=>{ try {
  const rows=await prisma.$queryRawUnsafe<Array<{id:string;title:string;league:string|null;status:string;scheduled_at:Date}>>(`SELECT e.id,e.title,e.league,e.status::text,e.scheduled_at FROM events e JOIN notification_preferences p ON p.event_ids ? e.id WHERE p.user_id=$1 ORDER BY e.scheduled_at DESC LIMIT 100`,req.user!.id);
  res.json({success:true,data:rows.map(e=>({id:e.id,title:e.title,league:e.league,status:e.status,scheduledAt:e.scheduled_at}))});
}catch(e){next(e)} });
router.put('/preferences', async(req:AuthRequest,res,next)=>{ try {
  const parsed=prefsSchema.safeParse(req.body); if(!parsed.success){res.status(400).json({success:false,error:'Preferências inválidas'});return;}
  const p=parsed.data; const ids=Array.from(new Set(p.eventIds));
  if(ids.length){const found=await prisma.$queryRawUnsafe<Array<{id:string}>>('SELECT id FROM events WHERE id = ANY($1::text[])',ids); if(found.length!==ids.length){res.status(400).json({success:false,error:'Um ou mais jogos não existem'});return;}}
  await prisma.$executeRawUnsafe(`INSERT INTO notification_preferences (user_id,announcements,goals,match_start,daily,event_ids,cards) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7) ON CONFLICT (user_id) DO UPDATE SET announcements=$2,goals=$3,match_start=$4,daily=$5,event_ids=$6::jsonb,cards=$7,updated_at=now()`,req.user!.id,p.announcements,p.goals,p.matchStart,p.daily,JSON.stringify(ids),p.cards);
  res.json({success:true,data:{...p,eventIds:ids}});
} catch(e){next(e)} });
router.post('/subscription-status', async(req:AuthRequest,res,next)=>{ try {
  const endpoint=String(req.body?.endpoint||'');
  const rows=await prisma.$queryRawUnsafe<Array<{endpoint:string}>>('SELECT endpoint FROM push_subscriptions WHERE endpoint=$1 AND user_id=$2',endpoint,req.user!.id);
  res.json({success:true,data:{subscribed:rows.length>0}});
}catch(e){next(e)} });
router.post('/subscribe', async(req:AuthRequest,res,next)=>{ try {
  if(!pushConfig().configured){res.status(503).json({success:false,error:'Notificações push ainda não configuradas no servidor'});return;}
  const schema=z.object({endpoint:z.string().url().max(2048),keys:z.object({p256dh:z.string().min(1).max(200),auth:z.string().min(1).max(100)})}); const parsed=schema.safeParse(req.body);
  if(!parsed.success || !safePushEndpoint(parsed.data.endpoint)){res.status(400).json({success:false,error:'Subscrição inválida ou fornecedor não suportado'});return;}
  const s=parsed.data;
  await prisma.$executeRawUnsafe(`INSERT INTO push_subscriptions(endpoint,user_id,p256dh,auth) VALUES($1,$2,$3,$4) ON CONFLICT(endpoint) DO UPDATE SET user_id=$2,p256dh=$3,auth=$4`,s.endpoint,req.user!.id,s.keys.p256dh,s.keys.auth);
  res.status(201).json({success:true,data:{subscribed:true}});
} catch(e){next(e)} });
router.post('/unsubscribe', async(req:AuthRequest,res,next)=>{ try {const endpoint=String(req.body?.endpoint||'');await prisma.$executeRawUnsafe('DELETE FROM push_subscriptions WHERE endpoint=$1 AND user_id=$2',endpoint,req.user!.id);res.json({success:true});}catch(e){next(e)} });
export default router;
