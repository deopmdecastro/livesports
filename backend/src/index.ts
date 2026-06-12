import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Routes
import authRoutes from './routes/auth.routes';
import liveRoutes from './routes/live.routes';
import eventRoutes from './routes/event.routes';
import userRoutes from './routes/user.routes';
import adRoutes from './routes/ad.routes';
import newsRoutes from './routes/news.routes';
import dashboardRoutes from './routes/dashboard.routes';
import categoryRoutes from './routes/category.routes';
import integrationRoutes from './routes/integration.routes';
import { ensureRuntimeSchema } from './lib/prisma';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression() as express.RequestHandler);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Muitas requisições, tente novamente mais tarde.' },
});
app.use('/api/', limiter);

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login, aguarde 15 minutos.' },
});

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'LiveSports API',
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/lives', liveRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/integrations', integrationRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

// Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
  });
});

// Socket.IO Real-time features
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-live', (liveId: string) => {
    socket.join(`live-${liveId}`);
    io.to(`live-${liveId}`).emit('viewer-joined', { liveId });
  });

  socket.on('leave-live', (liveId: string) => {
    socket.leave(`live-${liveId}`);
    io.to(`live-${liveId}`).emit('viewer-left', { liveId });
  });

  socket.on('chat-message', (data: { liveId: string; message: string; user: string }) => {
    io.to(`live-${data.liveId}`).emit('new-message', {
      id: Date.now(),
      user: data.user,
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
ensureRuntimeSchema().catch((error) => {
  console.error('Failed to prepare database schema:', error);
});
httpServer.listen(PORT, () => {
  console.log(`🚀 LiveSports API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});

export default app;
export { io };
