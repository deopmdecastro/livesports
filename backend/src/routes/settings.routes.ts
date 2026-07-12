import { Router } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

const BRANDING_KEY = 'branding';

const DEFAULT_BRANDING = {
  logoUrl: '',
  faviconUrl: '',
  ogImageUrl: '',
  primaryColor: '#E50914',
  siteName: 'LiveSports',
};

function normalizeBranding(value: any) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_BRANDING };
  return {
    logoUrl: typeof value.logoUrl === 'string' ? value.logoUrl : DEFAULT_BRANDING.logoUrl,
    faviconUrl: typeof value.faviconUrl === 'string' ? value.faviconUrl : DEFAULT_BRANDING.faviconUrl,
    ogImageUrl: typeof value.ogImageUrl === 'string' ? value.ogImageUrl : DEFAULT_BRANDING.ogImageUrl,
    primaryColor: typeof value.primaryColor === 'string' && value.primaryColor.trim()
      ? value.primaryColor
      : DEFAULT_BRANDING.primaryColor,
    siteName: typeof value.siteName === 'string' && value.siteName.trim()
      ? value.siteName.trim()
      : DEFAULT_BRANDING.siteName,
  };
}

// Public: consumed by Navbar, Footer, and any client that renders the site branding
router.get('/branding', async (_req, res, next) => {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: BRANDING_KEY } });
    res.json({ success: true, data: normalizeBranding(row?.value) });
  } catch (error: any) {
    // Table not migrated yet on this environment — don't break the footer/navbar,
    // just serve defaults until `prisma migrate deploy` has run.
    if (error?.code === 'P2021' || /does not exist/i.test(error?.message || '')) {
      res.json({ success: true, data: { ...DEFAULT_BRANDING } });
      return;
    }
    next(error);
  }
});

// Admin only: called from Definições / Identidade Visual
router.put('/branding', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const normalized = normalizeBranding(req.body);
    const row = await prisma.siteSetting.upsert({
      where: { key: BRANDING_KEY },
      create: { key: BRANDING_KEY, value: normalized },
      update: { value: normalized },
    });
    res.json({ success: true, data: normalizeBranding(row.value) });
  } catch (error: any) {
    if (error?.code === 'P2021' || /does not exist/i.test(error?.message || '')) {
      res.status(503).json({
        success: false,
        error: 'Base de dados desatualizada: falta a migração site_settings. Corre "prisma migrate deploy".',
      });
      return;
    }
    next(error);
  }
});

export default router;
