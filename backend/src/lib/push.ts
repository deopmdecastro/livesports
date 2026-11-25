import webPush from 'web-push';
import { prisma } from './prisma';

const publicKey = process.env.VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || '';
let configured = false;
if (publicKey && privateKey && /^(mailto:|https:\/\/)/.test(subject)) {
  try { webPush.setVapidDetails(subject, publicKey, privateKey); configured = true; }
  catch { console.error('[push] VAPID keys inválidas; notificações push desativadas'); }
}
export function pushConfig() { return { configured, publicKey: configured ? publicKey : null }; }
export function safePushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && (
      host === 'fcm.googleapis.com' || host === 'updates.push.services.mozilla.com' || host === 'web.push.apple.com' || host.endsWith('.push.apple.com')
    );
  } catch { return false; }
}
export async function sendPush(userId: string, payload: { title: string; body?: string; link?: string; id?: string; category?: string }) {
  if (!configured) return;
  const prefs = await prisma.$queryRawUnsafe<Array<{ announcements: boolean; goals: boolean; match_start: boolean; daily: boolean }>>('SELECT announcements, goals, match_start, daily FROM notification_preferences WHERE user_id=$1', userId);
  const p = prefs[0];
  const category = payload.category;
  if (category === 'announcements' && p && !p.announcements) return;
  if (category === 'goals' && p && !p.goals) return;
  if (category === 'match_start' && p && !p.match_start) return;
  if (category === 'daily' && (!p || !p.daily)) return;
  const subscriptions = await prisma.$queryRawUnsafe<Array<{endpoint:string;p256dh:string;auth:string}>>('SELECT endpoint,p256dh,auth FROM push_subscriptions WHERE user_id=$1', userId);
  await Promise.allSettled(subscriptions.map(async sub => {
    if (!safePushEndpoint(sub.endpoint)) return;
    try { await webPush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}}, JSON.stringify(payload), { TTL: 3600, timeout: 10000 }); }
    catch (e: any) { if (e.statusCode === 404 || e.statusCode === 410) await prisma.$executeRawUnsafe('DELETE FROM push_subscriptions WHERE endpoint=$1', sub.endpoint); else console.warn('[push] Falha ao enviar:', e.statusCode || e.message); }
  }));
}
