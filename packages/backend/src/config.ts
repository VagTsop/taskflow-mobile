import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3004'),
  jwtSecret: process.env.JWT_SECRET || 'taskflow-dev-secret',
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../data/taskflow.db'),
};
