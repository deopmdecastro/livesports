import { prisma } from './prisma';

type Event = {id:string;title:string;team_a:string;team_b:string;scheduled_at:Date};
type SearchItem = {id?:{videoId?:string};snippet?:{title?:string;channelId?:string;channelTitle?:string;publishedAt?:string;liveBroadcastContent?:string}};
type Video = {id?:string;snippet?:{title?:string;channelId?:string;channelTitle?:string;publishedAt?:string;liveBroadcastContent?:string};status?:{privacyStatus?:string;embeddable?:boolean};contentDetails?:{duration?:string}};
const norm=(v:string)=>v.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&amp;/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const titleOk=(title:string,a:string,b:string)=>{
 const t=` ${norm(title)} `,home=norm(a),away=norm(b);
 if(home.length<4||away.length<4||home===away||!t.includes(` ${home} `)||!t.includes(` ${away} `))return false;
 if(!/\b(highlights|highlight|resumo|resumen|melhores momentos|melhores jogadas|best moments)\b/.test(t))return false;
 return !/\b(preview|previsao|palpite|prediction|simulacao|simulation|efootball|pes 202[0-9]|fc 2[0-9]|fifa 2[0-9]|interview|entrevista|reaction|reacao|trailer|press conference|full match|ao vivo|live stream)\b/.test(t);
};
function seconds(iso:string){const m=/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);return m?Number(m[1]||0)*3600+Number(m[2]||0)*60+Number(m[3]||0):0;}
export function isSuitableVideo(video:Video,event:Event,channels:string[]):boolean {
 const s=video.snippet, id=video.id, date=new Date(s?.publishedAt||'').getTime(),start=new Date(event.scheduled_at).getTime();
 return !!(id&&/^[\w-]{11}$/.test(id)&&s?.channelId&&channels.includes(s.channelId)&&s.title&&titleOk(s.title,event.team_a,event.team_b)&&Number.isFinite(date)&&Number.isFinite(start)&&date>=start+45*60_000&&date<=start+4*86400_000&&s.liveBroadcastContent==='none'&&video.status?.privacyStatus==='public'&&video.status?.embeddable===true&&seconds(video.contentDetails?.duration||'')>=45&&seconds(video.contentDetails?.duration||'')<=1800);
}
export async function ensureAutoHighlightsSchema(){
 await prisma.$executeRawUnsafe(`ALTER TABLE event_highlights ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'manual', ADD COLUMN IF NOT EXISTS channel_id TEXT, ADD COLUMN IF NOT EXISTS channel_name TEXT`);
 await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS highlight_search_jobs (event_id TEXT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE, blocked BOOLEAN NOT NULL DEFAULT false, next_check TIMESTAMPTZ, locked_until TIMESTAMPTZ, last_result TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
 await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS highlight_search_quota (day DATE PRIMARY KEY, requests INTEGER NOT NULL DEFAULT 0)`);
}
function config(){const key=(process.env.YOUTUBE_DATA_API_KEY||'').trim();const channels=[...new Set((process.env.YOUTUBE_HIGHLIGHTS_CHANNEL_IDS||'').split(',').map(s=>s.trim()).filter(s=>/^UC[\w-]{22}$/.test(s)))].slice(0,3);const parsed=Number(process.env.YOUTUBE_SEARCH_DAILY_LIMIT||20);return {key,channels,limit:Number.isFinite(parsed)?Math.max(1,Math.min(100,Math.floor(parsed))):20,configured:!!key&&channels.length>0};}
export function highlightConfig(){const c=config();return {configured:c.configured,channels:c.channels.length};}
async function reserveSearch(limit:number){const rows=await prisma.$queryRawUnsafe<Array<{requests:number}>>(`INSERT INTO highlight_search_quota(day,requests) VALUES ((now() AT TIME ZONE 'America/Los_Angeles')::date,1) ON CONFLICT(day) DO UPDATE SET requests=highlight_search_quota.requests+1 WHERE highlight_search_quota.requests < $1 RETURNING requests`,limit);return rows.length>0;}
async function youtube(path:string,params:Record<string,string>,key:string){const u=new URL(`https://www.googleapis.com/youtube/v3/${path}`);for(const [k,v] of Object.entries(params))u.searchParams.set(k,v);const r=await fetch(u,{headers:{'x-goog-api-key':key,Accept:'application/json'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error(`YouTube API HTTP ${r.status}`);return await r.json() as any;}
export async function findHighlightForEvent(event:Event,key:string,channels:string[],limit:number):Promise<Video|null>{
 const start=new Date(event.scheduled_at).getTime();if(!Number.isFinite(start)||!event.team_a||!event.team_b||norm(event.team_a).length<4||norm(event.team_b).length<4)return null;
 const found=new Set<string>();
 for(const channel of channels){if(!await reserveSearch(limit))throw new Error('Limite diário de pesquisas atingido');
 const result=await youtube('search',{part:'snippet',type:'video',channelId:channel,videoEmbeddable:'true',order:'date',maxResults:'25',q:`${event.team_a} ${event.team_b}`,publishedAfter:new Date(start+45*60_000).toISOString(),publishedBefore:new Date(start+4*86400_000).toISOString()},key);
 for(const item of (Array.isArray(result.items)?result.items:[]) as SearchItem[]){const id=item.id?.videoId,s=item.snippet;if(id&&/^[\w-]{11}$/.test(id)&&s?.channelId===channel&&s.title&&titleOk(s.title,event.team_a,event.team_b))found.add(id);}
 }
 if(!found.size||found.size>50)return null;
 const details=await youtube('videos',{part:'snippet,status,contentDetails',id:[...found].slice(0,50).join(',')},key);
 const matched=((Array.isArray(details.items)?details.items:[]) as Video[]).filter(v=>isSuitableVideo(v,event,channels));
 return matched.length===1?matched[0]:null;
}
let running=false;
export async function runHighlightsCycle(){
 const c=config();if(!c.configured||running)return;running=true;
 try{
 const events=await prisma.$queryRawUnsafe<Event[]>(`SELECT e.id,e.title,e.team_a,e.team_b,e.scheduled_at FROM events e LEFT JOIN event_highlights h ON h.event_id=e.id LEFT JOIN highlight_search_jobs j ON j.event_id=e.id WHERE e.status='finished' AND e.archived=false AND e.team_a IS NOT NULL AND e.team_b IS NOT NULL AND e.scheduled_at BETWEEN now()-interval '7 days' AND now()-interval '1 hour' AND h.event_id IS NULL AND COALESCE(j.blocked,false)=false AND (j.next_check IS NULL OR j.next_check<=now()) AND (j.locked_until IS NULL OR j.locked_until<now()) ORDER BY j.next_check ASC NULLS FIRST,e.scheduled_at DESC LIMIT 5`);
 for(const e of events){const claimed=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO highlight_search_jobs(event_id,locked_until) VALUES($1,now()+interval '3 minutes') ON CONFLICT(event_id) DO UPDATE SET locked_until=now()+interval '3 minutes',updated_at=now() WHERE highlight_search_jobs.blocked=false AND (highlight_search_jobs.next_check IS NULL OR highlight_search_jobs.next_check<=now()) AND (highlight_search_jobs.locked_until IS NULL OR highlight_search_jobs.locked_until<now()) RETURNING event_id`,e.id);if(!claimed.length)continue;
 let result='sem correspondência';
 try {const video=await findHighlightForEvent(e,c.key,c.channels,c.limit);if(video&&video.id&&video.snippet){const inserted=await prisma.$transaction(async tx=>{const rows=await tx.$queryRawUnsafe<any[]>('SELECT blocked FROM highlight_search_jobs WHERE event_id=$1 FOR UPDATE',e.id);if(rows[0]?.blocked)return 0;return tx.$executeRawUnsafe(`INSERT INTO event_highlights(event_id,youtube_id,title,origin,channel_id,channel_name) SELECT $1,$2,$3,'automatic',$4,$5 WHERE NOT EXISTS (SELECT 1 FROM event_highlights WHERE youtube_id=$2) ON CONFLICT(event_id) DO NOTHING`,e.id,video.id,video.snippet!.title!.slice(0,150),video.snippet!.channelId!,String(video.snippet!.channelTitle||'').slice(0,150));});result=inserted?'associado':'não associado';}}
 catch(err:any){result=String(err?.message||'erro').slice(0,200);console.warn('[highlights]',result);}
 finally{await prisma.$executeRawUnsafe(`UPDATE highlight_search_jobs SET locked_until=NULL,next_check=now()+interval '12 hours',last_result=$2,updated_at=now() WHERE event_id=$1`,e.id,result);}
 if(result.toLowerCase().includes('limite diário')||result.includes('HTTP 403')||result.includes('HTTP 429'))break;
 }
 }finally{running=false;}
}
export function startHighlightsWatcher(){const run=()=>void runHighlightsCycle().catch(e=>console.warn('[highlights]',e.message));run();const timer=setInterval(run,15*60_000);timer.unref();}
