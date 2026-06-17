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

// ─── Startup Security Checks ──────────────────────────────────────────────────
const DEFAULT_SECRET = 'livesports-secret-key';
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_SECRET)) {
  console.error('⛔  SECURITY: JWT_SECRET is missing or is the default value in production. Set a strong secret!');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set — using insecure default. Do NOT use in production!');
}

const app = express();
const httpServer = createServer(app);

// ─── CORS configuration (multi-origin support) ────────────────────────────────
const rawOrigins = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

// Socket.IO for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // managed by Next.js on frontend
    crossOriginEmbedderPolicy: false,
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);

// Additional security headers not covered by Helmet defaults
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(compression() as express.RequestHandler);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // increased for public API consumption
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas requisições, tente novamente mais tarde.' },
  skip: (req) => req.path === '/health', // don't rate-limit health checks
});
app.use('/api/', limiter);

// Auth rate limit (stricter — prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas tentativas de login, aguarde 15 minutos.' },
});

// Upload/mutation rate limit
const mutationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas operações de escrita. Aguarde um momento.' },
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
    maxAge: 86400, // 24h preflight cache
  }),
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' })); // reduced from 10mb for security
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ─── Request ID middleware ────────────────────────────────────────────────────
app.use((req: express.Request, res: express.Response, next) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  // Structured production logging
  app.use(morgan('combined'));
}

// ─── Audit Log Middleware ─────────────────────────────────────────────────────
// Logs all write operations (POST/PUT/PATCH/DELETE) to console (extend to DB as needed)
app.use((req: express.Request, res: express.Response, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const user = (req as any).user;
    const entry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      userId: user?.id || 'anonymous',
      userRole: user?.role || 'guest',
      ip: req.ip || req.socket?.remoteAddress,
      requestId: (req as any).requestId,
    };
    console.info('[AUDIT]', JSON.stringify(entry));
  }
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'LiveSports API',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/lives', liveRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/integrations', integrationRoutes);

// Apply mutation limiter to write operations on all routes
app.use('/api/', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return mutationLimiter(req, res, next);
  }
  next();
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: Error & { status?: number; code?: string }, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = err.status || 500;

  // Log with request context
  console.error(`[ERROR] ${req.method} ${req.path}`, {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    requestId: (req as any).requestId,
    userId: (req as any).user?.id,
  });

  // CORS error
  if (err.message?.includes('CORS')) {
    res.status(403).json({ success: false, error: 'Origem não permitida' });
    return;
  }

  // Validation errors (from Zod or similar)
  if (err.name === 'ZodError') {
    res.status(400).json({ success: false, error: 'Dados inválidos', details: err.message });
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
    requestId: (req as any).requestId,
  });
});

// ─── Socket.IO Real-time features ────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  socket.on('join-live', (liveId: string) => {
    // Validate liveId to prevent room spoofing
    if (typeof liveId !== 'string' || liveId.length > 100) return;
    socket.join(`live-${liveId}`);
    io.to(`live-${liveId}`).emit('viewer-joined', { liveId });
  });

  socket.on('leave-live', (liveId: string) => {
    if (typeof liveId !== 'string' || liveId.length > 100) return;
    socket.leave(`live-${liveId}`);
    io.to(`live-${liveId}`).emit('viewer-left', { liveId });
  });

  socket.on('chat-message', (data: { liveId: string; message: string; user: string }) => {
    // Sanitize inputs
    if (typeof data?.liveId !== 'string' || typeof data?.message !== 'string') return;
    const safeMessage = String(data.message).slice(0, 500);
    const safeUser = String(data.user || 'Anônimo').slice(0, 50);
    io.to(`live-${data.liveId}`).emit('new-message', {
      id: Date.now(),
      user: safeUser,
      message: safeMessage,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// ─── Server Startup ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
ensureRuntimeSchema().catch((error) => {
  console.error('Failed to prepare database schema:', error);
});

httpServer.listen(PORT, () => {
  console.log(`🚀 LiveSports API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});

export default app;
export { io };
