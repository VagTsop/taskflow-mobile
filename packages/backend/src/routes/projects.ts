import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const projects = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count
    FROM projects p WHERE p.user_id = ? ORDER BY p.created_at DESC
  `).all(req.userId);
  res.json(projects);
});

router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { name, description, color, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });

  const db = getDb();
  const id = uuid();
  db.prepare('INSERT INTO projects (id,user_id,name,description,color,icon) VALUES (?,?,?,?,?,?)').run(id, req.userId, name, description || '', color || '#1976d2', icon || 'folder');
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(project);
});

router.put('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const { name, description, color, icon } = req.body;
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (!project) return res.status(404).json({ error: 'Project not found' });

  db.prepare('UPDATE projects SET name=?, description=?, color=?, icon=? WHERE id=?').run(
    name || project.name, description ?? project.description, color || project.color, icon || project.icon, req.params.id
  );
  const updated = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count
    FROM projects p WHERE p.id = ?
  `).get(req.params.id);
  res.json(updated);
});

router.delete('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
