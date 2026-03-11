import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';
import { config } from '../config';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const COLORS = ['#1976d2','#9c27b0','#2e7d32','#ed6c02','#d32f2f','#0288d1','#7b1fa2','#388e3c'];

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const id = uuid();
  const hash = bcrypt.hashSync(password, 10);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  db.prepare('INSERT INTO users (id,name,email,password,avatar_color) VALUES (?,?,?,?,?)').run(id, name, email, hash, color);

  const token = jwt.sign({ id }, config.jwtSecret, { expiresIn: '7d' });
  res.json({ token, user: { id, name, email, avatar_color: color } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar_color: user.avatar_color } });
});

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id,name,email,avatar_color,created_at FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.put('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const { name, avatar_color } = req.body;
  const db = getDb();
  if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.userId);
  if (avatar_color) db.prepare('UPDATE users SET avatar_color = ? WHERE id = ?').run(avatar_color, req.userId);
  const user = db.prepare('SELECT id,name,email,avatar_color,created_at FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

export default router;
