import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Token de acesso obrigatório' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'livesports-secret-key', {
      algorithms: ['HS256'],
    }) as {
      id: string;
      email: string;
      role: string;
      iat?: number;
      exp?: number;
    };
    req.user = decoded;
    next();
  } catch (error) {
    const msg = error instanceof jwt.TokenExpiredError
      ? 'Token expirado'
      : error instanceof jwt.JsonWebTokenError
        ? 'Token inválido'
        : 'Token inválido ou expirado';
    res.status(403).json({ success: false, error: msg });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Não autenticado' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Sem permissão para acessar este recurso',
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('admin', 'super_admin');
export const requireModerator = requireRole('admin', 'super_admin', 'moderator');
export const requireEditor = requireRole('admin', 'super_admin', 'moderator', 'editor');
