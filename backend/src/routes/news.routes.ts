import { Router } from 'express';
import { authenticateToken, requireEditor } from '../middleware/auth.middleware';

const router = Router();
const items: Record<string, unknown>[] = [];

router.get('/', (req, res) => res.json({ success: true, data: items }));
router.post('/', authenticateToken, requireEditor, (req, res) => {
  const item = { ...req.body, id: Date.now().toString(), createdAt: new Date().toISOString() };
  items.push(item);
  res.status(201).json({ success: true, data: item });
});
router.delete('/:id', authenticateToken, requireEditor, (req, res) => {
  const idx = items.findIndex((i: any) => i.id === req.params.id);
  if (idx !== -1) items.splice(idx, 1);
  res.json({ success: true });
});

export default router;
