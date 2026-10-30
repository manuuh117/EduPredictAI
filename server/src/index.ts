import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { prisma } from './lib/db.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'EduPredict AI API', message: 'System online.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'dist');
  app.use(express.static(clientDistPath));
  app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const startServer = async () => {
  await prisma.$connect();

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`EduPredict AI listening on port ${config.port}`);
  });
};

void startServer();

export default app;
