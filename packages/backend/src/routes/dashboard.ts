import { Router, Response } from 'express';
import { getDb } from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const totalTasks = (db.prepare('SELECT COUNT(*) as c FROM tasks WHERE user_id = ?').get(req.userId) as any).c;
  const completedToday = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE user_id = ? AND status = 'done' AND DATE(completed_at) = ?").get(req.userId, today) as any).c;
  const overdue = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE user_id = ? AND status != 'done' AND due_date < ?").get(req.userId, today) as any).c;
  const inProgress = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE user_id = ? AND status = 'in_progress'").get(req.userId) as any).c;

  const byStatus = db.prepare("SELECT status, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY status").all(req.userId);
  const byPriority = db.prepare("SELECT priority, COUNT(*) as count FROM tasks WHERE user_id = ? AND status != 'done' GROUP BY priority").all(req.userId);

  const upcoming = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color
    FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.user_id = ? AND t.status != 'done' AND t.due_date IS NOT NULL AND t.due_date >= ?
    ORDER BY t.due_date ASC LIMIT 10
  `).all(req.userId, today);

  const overdueTasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color
    FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.user_id = ? AND t.status != 'done' AND t.due_date < ?
    ORDER BY t.due_date ASC LIMIT 5
  `).all(req.userId, today);

  const recentlyCompleted = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color
    FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.user_id = ? AND t.status = 'done'
    ORDER BY t.completed_at DESC LIMIT 5
  `).all(req.userId);

  const projectStats = db.prepare(`
    SELECT p.id, p.name, p.color,
      COUNT(t.id) as total,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done
    FROM projects p LEFT JOIN tasks t ON t.project_id = p.id
    WHERE p.user_id = ? GROUP BY p.id ORDER BY total DESC
  `).all(req.userId);

  res.json({
    stats: { totalTasks, completedToday, overdue, inProgress },
    byStatus, byPriority, upcoming, overdueTasks, recentlyCompleted, projectStats,
  });
});

export default router;
