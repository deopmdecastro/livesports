/**
 * Seed script — creates a default super_admin user so the admin dashboard
 * (/admin/*) is reachable on a fresh database. This file was referenced by
 * the "db:seed" script in package.json but was missing from the repo, which
 * meant every freshly-registered user got the default `user` role and the
 * dashboard endpoints (which require requireAdmin) always returned 403.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@livesports.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Super Admin';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    if (existing.role !== 'super_admin' && existing.role !== 'admin') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'super_admin' },
      });
      console.log(`Updated existing user ${ADMIN_EMAIL} to role super_admin.`);
    } else {
      console.log(`Admin user ${ADMIN_EMAIL} already exists with role ${existing.role}.`);
    }
    return;
  }

  const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'super_admin',
      status: 'active',
      emailVerified: true,
    },
  });

  console.log('Created admin user:');
  console.log(`  email:    ${admin.email}`);
  console.log(`  password: ${ADMIN_PASSWORD} (change this after first login)`);
  console.log(`  role:     ${admin.role}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
