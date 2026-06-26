import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ success: false, error: 'Token de acesso obrigatório' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'livesports-secret-key') as {
      id: string;
      email: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, error: 'Token inválido ou expirado' });
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
