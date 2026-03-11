import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const labels = db.prepare('SELECT * FROM labels WHERE user_id = ? ORDER BY name').all(req.userId);
  res.json(labels);
});

router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Label name required' });
  const db = getDb();
  const id = uuid();
  db.prepare('INSERT INTO labels (id,user_id,name,color) VALUES (?,?,?,?)').run(id, req.userId, name, color || '#9e9e9e');
  res.status(201).json({ id, user_id: req.userId, name, color: color || '#9e9e9e' });
});

router.put('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const { name, color } = req.body;
  const db = getDb();
  const label = db.prepare('SELECT * FROM labels WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (!label) return res.status(404).json({ error: 'Label not found' });
  db.prepare('UPDATE labels SET name=?, color=? WHERE id=?').run(name || label.name, color || label.color, req.params.id);
  res.json({ ...label, name: name || label.name, color: color || label.color });
});

router.delete('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const label = db.prepare('SELECT * FROM labels WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!label) return res.status(404).json({ error: 'Label not found' });
  db.prepare('DELETE FROM labels WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
