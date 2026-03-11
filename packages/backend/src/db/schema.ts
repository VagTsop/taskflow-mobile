import { getDb } from './connection';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

export function initSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar_color TEXT DEFAULT '#1976d2',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#1976d2',
      icon TEXT DEFAULT 'folder',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo','in_progress','review','done')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
      due_date TEXT,
      reminder_at TEXT,
      position INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      color TEXT DEFAULT '#9e9e9e'
    );

    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, label_id)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
  `);

  // Seed data
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get() as any;
  if (count.c === 0) seed(db);
}

function seed(db: any) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const pw = bcrypt.hashSync('password123', 10);

  // Users
  const u1 = uuid(), u2 = uuid();
  db.prepare('INSERT INTO users (id,name,email,password,avatar_color) VALUES (?,?,?,?,?)').run(u1, 'Alex Demo', 'alex@demo.com', pw, '#1976d2');
  db.prepare('INSERT INTO users (id,name,email,password,avatar_color) VALUES (?,?,?,?,?)').run(u2, 'Sarah Test', 'sarah@demo.com', pw, '#9c27b0');

  // Projects for Alex
  const p1 = uuid(), p2 = uuid(), p3 = uuid();
  db.prepare('INSERT INTO projects (id,user_id,name,description,color,icon) VALUES (?,?,?,?,?,?)').run(p1, u1, 'Mobile App Redesign', 'Redesign the main mobile application with new UI/UX', '#2196f3', 'phone');
  db.prepare('INSERT INTO projects (id,user_id,name,description,color,icon) VALUES (?,?,?,?,?,?)').run(p2, u1, 'Marketing Campaign', 'Q1 2026 digital marketing campaign', '#4caf50', 'campaign');
  db.prepare('INSERT INTO projects (id,user_id,name,description,color,icon) VALUES (?,?,?,?,?,?)').run(p3, u1, 'Backend API v2', 'API refactoring and performance improvements', '#ff9800', 'code');

  // Labels for Alex
  const l1 = uuid(), l2 = uuid(), l3 = uuid(), l4 = uuid(), l5 = uuid();
  db.prepare('INSERT INTO labels (id,user_id,name,color) VALUES (?,?,?,?)').run(l1, u1, 'Bug', '#f44336');
  db.prepare('INSERT INTO labels (id,user_id,name,color) VALUES (?,?,?,?)').run(l2, u1, 'Feature', '#2196f3');
  db.prepare('INSERT INTO labels (id,user_id,name,color) VALUES (?,?,?,?)').run(l3, u1, 'Design', '#9c27b0');
  db.prepare('INSERT INTO labels (id,user_id,name,color) VALUES (?,?,?,?)').run(l4, u1, 'Documentation', '#607d8b');
  db.prepare('INSERT INTO labels (id,user_id,name,color) VALUES (?,?,?,?)').run(l5, u1, 'Urgent', '#ff5722');

  // Helper to get dates relative to now
  const d = (days: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + days);
    return dt.toISOString().slice(0, 10);
  };

  // Tasks for Alex across projects
  const tasks = [
    // Mobile App Redesign - todo
    { proj: p1, title: 'Design new onboarding flow', desc: 'Create wireframes and high-fidelity mockups for the onboarding experience', status: 'todo', priority: 'high', due: d(3), pos: 0, labels: [l3, l2] },
    { proj: p1, title: 'Implement push notifications', desc: 'Set up Firebase Cloud Messaging for push notifications', status: 'todo', priority: 'medium', due: d(7), pos: 1, labels: [l2] },
    { proj: p1, title: 'Fix login screen crash on Android', desc: 'App crashes when rotating screen during login animation', status: 'todo', priority: 'urgent', due: d(1), pos: 2, labels: [l1, l5] },
    // Mobile App Redesign - in progress
    { proj: p1, title: 'Update navigation structure', desc: 'Migrate from stack to tab-based navigation', status: 'in_progress', priority: 'high', due: d(2), pos: 0, labels: [l2] },
    { proj: p1, title: 'Refactor state management', desc: 'Move from Context API to Zustand for better performance', status: 'in_progress', priority: 'medium', due: d(5), pos: 1, labels: [l2] },
    // Mobile App Redesign - review
    { proj: p1, title: 'Dark mode implementation', desc: 'Support system-level dark mode preference', status: 'review', priority: 'medium', due: d(0), pos: 0, labels: [l3] },
    // Mobile App Redesign - done
    { proj: p1, title: 'Set up CI/CD pipeline', desc: 'Configure GitHub Actions for automated builds and tests', status: 'done', priority: 'high', due: d(-2), pos: 0, labels: [l2] },
    { proj: p1, title: 'Create component library', desc: 'Build reusable UI components with Storybook', status: 'done', priority: 'medium', due: d(-5), pos: 1, labels: [l3] },

    // Marketing Campaign
    { proj: p2, title: 'Write blog post series', desc: '5-part series on product features for the company blog', status: 'todo', priority: 'medium', due: d(10), pos: 0, labels: [l4] },
    { proj: p2, title: 'Design social media assets', desc: 'Create templates for Instagram, Twitter, and LinkedIn posts', status: 'in_progress', priority: 'high', due: d(4), pos: 0, labels: [l3] },
    { proj: p2, title: 'Set up email automation', desc: 'Configure drip campaign in Mailchimp for new signups', status: 'todo', priority: 'high', due: d(6), pos: 1, labels: [l2] },
    { proj: p2, title: 'Competitor analysis report', desc: 'Research and document competitor marketing strategies', status: 'done', priority: 'medium', due: d(-3), pos: 0, labels: [l4] },

    // Backend API v2
    { proj: p3, title: 'Migrate to PostgreSQL', desc: 'Replace SQLite with PostgreSQL for production readiness', status: 'todo', priority: 'high', due: d(14), pos: 0, labels: [l2] },
    { proj: p3, title: 'Add rate limiting', desc: 'Implement API rate limiting with Redis', status: 'todo', priority: 'medium', due: d(8), pos: 1, labels: [l2] },
    { proj: p3, title: 'Fix N+1 query in /orders', desc: 'Orders endpoint making separate query per item', status: 'in_progress', priority: 'urgent', due: d(1), pos: 0, labels: [l1, l5] },
    { proj: p3, title: 'Write API documentation', desc: 'Generate OpenAPI spec and interactive docs', status: 'review', priority: 'low', due: d(3), pos: 0, labels: [l4] },
    { proj: p3, title: 'Implement caching layer', desc: 'Add Redis caching for frequently accessed endpoints', status: 'done', priority: 'high', due: d(-1), pos: 0, labels: [l2] },

    // No project tasks
    { proj: null, title: 'Review pull requests', desc: 'Check pending PRs from team members', status: 'todo', priority: 'medium', due: d(0), pos: 3, labels: [] },
    { proj: null, title: 'Weekly standup prep', desc: 'Prepare status update for Monday standup', status: 'todo', priority: 'low', due: d(1), pos: 4, labels: [] },
    { proj: null, title: 'Update personal portfolio', desc: 'Add recent projects to portfolio website', status: 'todo', priority: 'low', due: d(12), pos: 5, labels: [] },
  ];

  const insertTask = db.prepare('INSERT INTO tasks (id,project_id,user_id,title,description,status,priority,due_date,position,completed_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  const insertTL = db.prepare('INSERT INTO task_labels (task_id,label_id) VALUES (?,?)');

  for (const t of tasks) {
    const tid = uuid();
    const completedAt = t.status === 'done' ? now : null;
    insertTask.run(tid, t.proj, u1, t.title, t.desc, t.status, t.priority, t.due, t.pos, completedAt, now, now);
    for (const lid of t.labels) {
      insertTL.run(tid, lid);
    }
  }

  console.log('Database seeded with demo data');
}
