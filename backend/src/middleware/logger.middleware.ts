import { Request, Response, NextFunction } from 'express';

interface RequestLog {
  ts: string;
  method: string;
  path: string;
  status?: number;
  durationMs?: number;
  ip?: string;
  userId?: string;
  userAgent?: string;
  requestId?: string;
  contentLength?: number;
}

/**
 * Structured request/response logger middleware.
 * Logs each request with timing, status code, and user context.
 */
export function structuredLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

  const log: RequestLog = {
    ts: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip,
    userId: (req as any).user?.id,
    userAgent: req.headers['user-agent'],
    requestId: (req as any).requestId,
  };

  res.on('finish', () => {
    log.status = res.statusCode;
    log.durationMs = Date.now() - startTime;
    log.contentLength = Number(res.getHeader('content-length')) || undefined;

    const level = log.status! >= 500 ? 'ERROR' : log.status! >= 400 ? 'WARN' : 'INFO';
    const emoji = log.status! >= 500 ? '🔴' : log.status! >= 400 ? '🟡' : '🟢';
    const line = `${emoji} [${level}] ${log.method} ${log.path} → ${log.status} (${log.durationMs}ms)`;

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(log));
    } else {
      console.log(line, log.userId ? `| user:${log.userId}` : '');
    }
  });

  next();
}

/**
 * Slow request detector — warns if a request takes > threshold ms
 */
export function slowRequestWarner(thresholdMs = 2000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > thresholdMs) {
        console.warn(`⚠️  [SLOW] ${req.method} ${req.path} took ${duration}ms (threshold: ${thresholdMs}ms)`);
      }
    });
    next();
  };
}
