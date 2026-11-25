import crypto from 'crypto';
import { prisma } from './prisma';
import { createNotification } from '../routes/notifications.routes';

export async function ensureCardSchema() {
  await prisma.$executeRawUnsafe('ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS cards BOOLEAN NOT NULL DEFAULT false');
  await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS notification_card_state (event_id TEXT PRIMARY KEY, initialized BOOLEAN NOT NULL DEFAULT false, checked_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS notification_seen_cards (event_id TEXT NOT NULL, card_key TEXT NOT NULL, PRIMARY KEY(event_id,card_key))');
}
type Card={key:string;kind:'Amarelo'|'Vermelho';player:string;team:string;minute:string};
export function parseApiFootballCards(input:unknown):Card[] {
  if (!Array.isArray(input)) throw new Error('Resposta de eventos inválida');
  const found = new Map<string,Card>();
  for (const raw of input) {
    if (!raw || typeof raw !== 'object' || raw.type !== 'Card' || !/^(Yellow Card|Red Card|Second Yellow card)$/i.test(String(raw.detail||''))) continue;
    if (raw.time?.elapsed == null) continue;
    const minute=Number(raw.time.elapsed); const extra=raw.time?.extra == null ? null : Number(raw.time.extra);
    const teamId=raw.team?.id, playerId=raw.player?.id;
    // A stable identity is mandatory; incomplete events cannot be safely deduplicated.
    if (!Number.isInteger(minute) || minute < 0 || (extra!==null && !Number.isInteger(extra)) || !Number.isInteger(teamId) || !Number.isInteger(playerId)) continue;
    const detail=String(raw.detail);const kind = /red|second/i.test(detail) ? 'Vermelho' : 'Amarelo';
    const key=crypto.createHash('sha256').update(JSON.stringify([minute,extra,teamId,playerId,detail.toLowerCase()])).digest('hex');
    found.set(key,{key,kind,player:String(raw.player?.name||'Jogador').slice(0,100),team:String(raw.team?.name||'Equipa').slice(0,100),minute:`${minute}${extra?`+${extra}`:''}'`});
  }
  return [...found.values()];
}
let running=false; let nextRun=0;
export async function runCardNotificationCycle() {
  const token=process.env.API_FOOTBALL_KEY?.trim();
  if (running || Date.now()<nextRun || !token || token==='your-api-football-key') return;
  running=true; nextRun=Date.now()+Math.max(300_000,Number(process.env.CARD_POLL_INTERVAL_MS)||600_000);
  try {
    const events=await prisma.$queryRawUnsafe<Array<{id:string;title:string}>>(`SELECT DISTINCT e.id,e.title FROM events e JOIN notification_preferences p ON p.event_ids ? e.id AND (p.cards=true OR p.goals=true OR p.match_start=true) JOIN users u ON u.id=p.user_id AND u.status='active' WHERE e.id ~ '^api-football-[0-9]+$' AND e.sport='football' AND e.status IN ('upcoming','live') AND e.scheduled_at BETWEEN now()-interval '4 hours' AND now()+interval '15 minutes' AND e.archived=false ORDER BY e.id LIMIT 20`);
    if (!events.length) return;
    const url=new URL('https://v3.football.api-sports.io/fixtures');
    url.searchParams.set('ids',events.map(e=>e.id.slice('api-football-'.length)).join('-'));
    const response=await fetch(url,{headers:{'x-apisports-key':token},signal:AbortSignal.timeout(15000)});
    if(response.status===429){nextRun=Date.now()+30*60_000;throw new Error('API-Football limitou os pedidos; pausa de 30 minutos');}
    if(!response.ok) throw new Error(`API-Football HTTP ${response.status}`);
    const remaining=response.headers.get('x-ratelimit-requests-remaining');
    if(remaining!==null && Number(remaining)<=2) { nextRun=Date.now()+60*60_000; console.warn('[cards] Quota diária quase esgotada; pausa de uma hora'); }
    const body:any=await response.json();
    if (body.errors && Object.keys(body.errors).length) { nextRun=Date.now()+30*60_000; throw new Error('API-Football retornou erro ou quota esgotada'); }
    if (!Array.isArray(body.response)) throw new Error('Resposta inválida da API-Football');
    const byId = new Map(events.map(e=>[e.id,e]));
    for (const fixture of body.response) {
      const e=byId.get(`api-football-${fixture?.fixture?.id}`);
      if(!e) continue;
      try {
        const status=String(fixture.fixture?.status?.short||'');
        const live=['1H','HT','2H','ET','BT','P','LIVE'].includes(status);
        const finished=['FT','AET','PEN'].includes(status);
        const home=fixture.goals?.home, away=fixture.goals?.away;
        if ((live||finished) && Number.isInteger(home) && Number.isInteger(away) && home>=0 && away>=0) {
          await prisma.$executeRawUnsafe(`UPDATE events SET status=$2::event_status,score_a=$3,score_b=$4,updated_at=now() WHERE id=$1`,e.id,live?'live':'finished',home,away);
        }
        // Some competitions/plans do not include events; never baseline a missing list.
        if (!live || !Array.isArray(fixture.events)) continue;
        const cards=parseApiFootballCards(fixture.events);
        const fresh=await prisma.$transaction(async tx=>{
          await tx.$executeRawUnsafe('INSERT INTO notification_card_state(event_id) VALUES($1) ON CONFLICT DO NOTHING',e.id);
          const [state]=await tx.$queryRawUnsafe<Array<{initialized:boolean}>>('SELECT initialized FROM notification_card_state WHERE event_id=$1 FOR UPDATE',e.id);
          const added:Card[]=[];
          for(const card of cards){const inserted=await tx.$queryRawUnsafe<Array<{card_key:string}>>('INSERT INTO notification_seen_cards(event_id,card_key) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING card_key',e.id,card.key);if(state.initialized&&inserted.length)added.push(card);}
          await tx.$executeRawUnsafe('UPDATE notification_card_state SET initialized=true,checked_at=now() WHERE event_id=$1',e.id);
          return added;
        });
        if(!fresh.length) continue;
        const recipients=await prisma.$queryRawUnsafe<Array<{user_id:string}>>(`SELECT p.user_id FROM notification_preferences p JOIN users u ON u.id=p.user_id AND u.status='active' WHERE p.cards=true AND p.event_ids ? $1`,e.id);
        for(const card of fresh) for(const user of recipients) await createNotification({userId:user.user_id,type:'live',title:`Cartão ${card.kind.toLowerCase()}`,message:`${card.player} (${card.team}), ${card.minute} — ${e.title}`,link:`/evento/${encodeURIComponent(e.id)}`,meta:{category:'cards',eventId:e.id,source:'API-Football'}});
      } catch(err:any){console.warn('[cards] Falha ao consultar jogo',e.id,err?.message||'erro');}
    }
  } finally {running=false;}
}
