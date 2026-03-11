import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initSchema } from './db/schema';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import labelRoutes from './routes/labels';
import dashboardRoutes from './routes/dashboard';

const app = express();
app.use(cors());
app.use(express.json());

initSchema();

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(config.port, () => {
  console.log(`TaskFlow API running on http://localhost:${config.port}`);
});
