import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(authenticateToken, requireAdmin);

const DEFAULT_POSITIONS = ['header','sidebar','in_content','player','popup','footer','live_preroll'];
const LABELS: Record<string,string> = {
  header:'Topo global',sidebar:'Sidebar direita',in_content:'Meio do conteudo',
  player:'Player pre-roll',popup:'Popup/flutuante',footer:'Rodape global',
  live_preroll:'Pre-roll Live'
};

router.get('/', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT position, COUNT(*)::bigint as ad_count,
             COUNT(*) FILTER (WHERE active=true)::bigint as active_count
      FROM "ads" GROUP BY position ORDER BY position
    `);
    const items = DEFAULT_POSITIONS.map((pos,i) => {
      const found = rows.find(r => r.position === pos);
      return {
        id: String(i+1), position: pos,
        label: LABELS[pos] || pos,
        adCount: Number(found?.ad_count||0),
        activeCount: Number(found?.active_count||0),
        status: 'active'
      };
    });
    res.json({ success: true, data: items });
  } catch(e) { next(e); }
});

export default router;
