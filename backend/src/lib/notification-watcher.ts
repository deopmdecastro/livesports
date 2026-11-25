import { prisma } from './prisma';
import { createNotification } from '../routes/notifications.routes';

export async function ensurePushSchema() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS push_subscriptions (endpoint TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, p256dh TEXT NOT NULL, auth TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions(user_id)`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS notification_preferences (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, announcements BOOLEAN NOT NULL DEFAULT true, goals BOOLEAN NOT NULL DEFAULT true, match_start BOOLEAN NOT NULL DEFAULT true, daily BOOLEAN NOT NULL DEFAULT false, event_ids JSONB NOT NULL DEFAULT '[]', updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS notification_event_state (event_id TEXT PRIMARY KEY, status TEXT NOT NULL, score_a INTEGER, score_b INTEGER, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS notification_daily_log (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, day DATE NOT NULL, PRIMARY KEY (user_id,day))`);
}
type Event = {id:string;title:string;sport:string;status:string;score_a:number|null;score_b:number|null;team_a:string|null;team_b:string|null};
let running=false;
export async function runNotificationCycle() {
  if(running) return; running=true;
  try {
    const events=await prisma.$queryRawUnsafe<Event[]>(`SELECT DISTINCT e.id,e.title,e.sport::text,e.status::text,e.score_a,e.score_b,e.team_a,e.team_b FROM events e JOIN notification_preferences p ON p.event_ids ? e.id JOIN users u ON u.id=p.user_id AND u.status='active' WHERE e.status IN ('upcoming','live','finished') AND e.scheduled_at > now()-interval '3 days' AND e.scheduled_at < now()+interval '7 days' LIMIT 2000`);
    for(const e of events) {
      const old=await prisma.$transaction(async tx=>{
        // Row locking serializes state changes across server instances.
        await tx.$executeRawUnsafe('INSERT INTO notification_event_state(event_id,status,score_a,score_b) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',e.id,e.status,e.score_a,e.score_b);
        const rows=await tx.$queryRawUnsafe<Array<{status:string;score_a:number|null;score_b:number|null}>>('SELECT status,score_a,score_b FROM notification_event_state WHERE event_id=$1 FOR UPDATE',e.id);
        await tx.$executeRawUnsafe('UPDATE notification_event_state SET status=$2,score_a=$3,score_b=$4,updated_at=now() WHERE event_id=$1',e.id,e.status,e.score_a,e.score_b);
        return rows[0];
      });
      const started=old.status==='upcoming' && e.status==='live';
      const goal=e.sport==='football' && e.status==='live' && old.score_a!==null && old.score_b!==null && e.score_a!==null && e.score_b!==null && (e.score_a>old.score_a || e.score_b>old.score_b);
      if(!started && !goal) continue;
      const recipients=await prisma.$queryRawUnsafe<Array<{user_id:string;goals:boolean;match_start:boolean}>>(`SELECT p.user_id,p.goals,p.match_start FROM notification_preferences p JOIN users u ON u.id=p.user_id AND u.status='active' WHERE p.event_ids ? $1`,e.id);
      for(const p of recipients){
        if(started && p.match_start) await createNotification({userId:p.user_id,type:'live',title:'O jogo começou',message:e.title,link:`/evento/${encodeURIComponent(e.id)}`,meta:{category:'match_start',eventId:e.id}});
        if(goal && p.goals) await createNotification({userId:p.user_id,type:'live',title:'Golo — atualização do marcador',message:`${e.team_a || 'Casa'} ${e.score_a}–${e.score_b} ${e.team_b || 'Fora'}`,link:`/evento/${encodeURIComponent(e.id)}`,meta:{category:'goals',eventId:e.id}});
      }
    }
    // Daily digest at 08:00 UTC or the first subsequent cycle, once per UTC day.
    if(new Date().getUTCHours()>=8){
      const count=await prisma.$queryRawUnsafe<Array<{n:bigint}>>(`SELECT count(*)::bigint n FROM events WHERE archived=false AND scheduled_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AND scheduled_at < (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '1 day') AT TIME ZONE 'UTC' AND status IN ('upcoming','live')`);
      const n=Number(count[0]?.n || 0);
      if(n>0){ const users=await prisma.$queryRawUnsafe<Array<{user_id:string}>>(`SELECT p.user_id FROM notification_preferences p JOIN users u ON u.id=p.user_id AND u.status='active' WHERE p.daily=true`);
        for(const p of users){const claimed=await prisma.$queryRawUnsafe<Array<{user_id:string}>>(`INSERT INTO notification_daily_log(user_id,day) VALUES($1,(now() AT TIME ZONE 'UTC')::date) ON CONFLICT DO NOTHING RETURNING user_id`,p.user_id);if(claimed.length) await createNotification({userId:p.user_id,type:'system',title:'Jogos do dia',message:`${n} jogos disponíveis hoje no calendário (UTC).`,link:'/calendario',meta:{category:'daily'}});}
      }
    }
  } finally {running=false;}
}
export function startNotificationWatcher(){ const run=()=>runNotificationCycle().catch(e=>console.warn('[notification-watcher]',e.message)); void run(); const timer=setInterval(run,60_000);timer.unref(); }
