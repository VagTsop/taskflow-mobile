import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get tasks with filters
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { project_id, status, priority, due_date, search, sort } = req.query;
  const db = getDb();

  let where = 'WHERE t.user_id = ?';
  const params: any[] = [req.userId];

  if (project_id) { where += ' AND t.project_id = ?'; params.push(project_id); }
  if (status) { where += ' AND t.status = ?'; params.push(status); }
  if (priority) { where += ' AND t.priority = ?'; params.push(priority); }
  if (due_date) { where += ' AND t.due_date = ?'; params.push(due_date); }
  if (search) { where += ' AND (LOWER(t.title) LIKE ? OR LOWER(t.description) LIKE ?)'; params.push(`%${(search as string).toLowerCase()}%`, `%${(search as string).toLowerCase()}%`); }

  let orderBy = 'ORDER BY t.status, t.position ASC, t.created_at DESC';
  if (sort === 'due_date') orderBy = 'ORDER BY CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END, t.due_date ASC';
  if (sort === 'priority') orderBy = "ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END";
  if (sort === 'created') orderBy = 'ORDER BY t.created_at DESC';

  const tasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color,
      (SELECT json_group_array(json_object('id', l.id, 'name', l.name, 'color', l.color))
       FROM task_labels tl JOIN labels l ON l.id = tl.label_id WHERE tl.task_id = t.id) as labels
    FROM tasks t
    LEFT JOIN projects p ON p.id = t.project_id
    ${where} ${orderBy}
  `).all(...params);

  // Parse labels JSON
  const parsed = tasks.map((t: any) => ({ ...t, labels: JSON.parse(t.labels || '[]').filter((l: any) => l.id) }));
  res.json(parsed);
});

// Get tasks grouped by status (for kanban)
router.get('/kanban', requireAuth, (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  const db = getDb();

  let where = 'WHERE t.user_id = ?';
  const params: any[] = [req.userId];
  if (project_id) { where += ' AND t.project_id = ?'; params.push(project_id); }

  const tasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color,
      (SELECT json_group_array(json_object('id', l.id, 'name', l.name, 'color', l.color))
       FROM task_labels tl JOIN labels l ON l.id = tl.label_id WHERE tl.task_id = t.id) as labels
    FROM tasks t
    LEFT JOIN projects p ON p.id = t.project_id
    ${where} ORDER BY t.position ASC, t.created_at DESC
  `).all(...params);

  const parsed = tasks.map((t: any) => ({ ...t, labels: JSON.parse(t.labels || '[]').filter((l: any) => l.id) }));

  const kanban = {
    todo: parsed.filter((t: any) => t.status === 'todo'),
    in_progress: parsed.filter((t: any) => t.status === 'in_progress'),
    review: parsed.filter((t: any) => t.status === 'review'),
    done: parsed.filter((t: any) => t.status === 'done'),
  };
  res.json(kanban);
});

// Get tasks for calendar (grouped by date)
router.get('/calendar', requireAuth, (req: AuthRequest, res: Response) => {
  const { month, year } = req.query;
  const db = getDb();

  let where = 'WHERE t.user_id = ? AND t.due_date IS NOT NULL';
  const params: any[] = [req.userId];

  if (month && year) {
    const m = String(month).padStart(2, '0');
    where += ' AND t.due_date >= ? AND t.due_date <= ?';
    const start = `${year}-${m}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const end = `${year}-${m}-${lastDay}`;
    params.push(start, end);
  }

  const tasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color
    FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
    ${where} ORDER BY t.due_date ASC, t.priority DESC
  `).all(...params);

  res.json(tasks);
});

// Get single task
router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const task = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color,
      (SELECT json_group_array(json_object('id', l.id, 'name', l.name, 'color', l.color))
       FROM task_labels tl JOIN labels l ON l.id = tl.label_id WHERE tl.task_id = t.id) as labels
    FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.id = ? AND t.user_id = ?
  `).get(req.params.id, req.userId) as any;

  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.labels = JSON.parse(task.labels || '[]').filter((l: any) => l.id);
  res.json(task);
});

// Create task
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { title, description, project_id, status, priority, due_date, reminder_at, labels } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const db = getDb();
  const id = uuid();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  // Get max position for the status column
  const maxPos = db.prepare('SELECT MAX(position) as mp FROM tasks WHERE user_id = ? AND status = ?').get(req.userId, status || 'todo') as any;
  const position = (maxPos?.mp ?? -1) + 1;

  db.prepare('INSERT INTO tasks (id,project_id,user_id,title,description,status,priority,due_date,reminder_at,position,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(
    id, project_id || null, req.userId, title, description || '', status || 'todo', priority || 'medium', due_date || null, reminder_at || null, position, now, now
  );

  if (labels?.length) {
    const ins = db.prepare('INSERT INTO task_labels (task_id,label_id) VALUES (?,?)');
    for (const lid of labels) ins.run(id, lid);
  }

  const task = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color,
      (SELECT json_group_array(json_object('id', l.id, 'name', l.name, 'color', l.color))
       FROM task_labels tl JOIN labels l ON l.id = tl.label_id WHERE tl.task_id = t.id) as labels
    FROM tasks t LEFT JOIN projects p ON p.id = t.project_id WHERE t.id = ?
  `).get(id) as any;
  task.labels = JSON.parse(task.labels || '[]').filter((l: any) => l.id);
  res.status(201).json(task);
});

// Update task
router.put('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, project_id, status, priority, due_date, reminder_at, labels } = req.body;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  let completedAt = task.completed_at;
  if (status === 'done' && task.status !== 'done') completedAt = now;
  if (status && status !== 'done') completedAt = null;

  db.prepare(`UPDATE tasks SET title=?, description=?, project_id=?, status=?, priority=?, due_date=?, reminder_at=?, completed_at=?, updated_at=? WHERE id=?`).run(
    title ?? task.title, description ?? task.description, project_id !== undefined ? (project_id || null) : task.project_id,
    status || task.status, priority || task.priority, due_date !== undefined ? (due_date || null) : task.due_date,
    reminder_at !== undefined ? (reminder_at || null) : task.reminder_at, completedAt, now, req.params.id
  );

  if (labels !== undefined) {
    db.prepare('DELETE FROM task_labels WHERE task_id = ?').run(req.params.id);
    if (labels?.length) {
      const ins = db.prepare('INSERT INTO task_labels (task_id,label_id) VALUES (?,?)');
      for (const lid of labels) ins.run(req.params.id, lid);
    }
  }

  const updated = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color,
      (SELECT json_group_array(json_object('id', l.id, 'name', l.name, 'color', l.color))
       FROM task_labels tl JOIN labels l ON l.id = tl.label_id WHERE tl.task_id = t.id) as labels
    FROM tasks t LEFT JOIN projects p ON p.id = t.project_id WHERE t.id = ?
  `).get(req.params.id) as any;
  updated.labels = JSON.parse(updated.labels || '[]').filter((l: any) => l.id);
  res.json(updated);
});

// Move task (change status + reorder)
router.put('/:id/move', requireAuth, (req: AuthRequest, res: Response) => {
  const { status, position } = req.body;
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  let completedAt = task.completed_at;
  if (status === 'done' && task.status !== 'done') completedAt = now;
  if (status && status !== 'done') completedAt = null;

  db.prepare('UPDATE tasks SET status=?, position=?, completed_at=?, updated_at=? WHERE id=?').run(
    status || task.status, position ?? task.position, completedAt, now, req.params.id
  );

  res.json({ success: true });
});

// Delete task
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
