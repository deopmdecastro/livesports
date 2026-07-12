/**
 * Seed script for local/demo environments.
 *
 * Creates three default accounts:
 * - super admin
 * - normal user
 * - creator user + creator channel
 *
 * All accounts can be customized with environment variables.
 */
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const seedConfig = {
  admin: {
    name: process.env.SEED_ADMIN_NAME || 'Super Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@livesports.local',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
    role: 'super_admin' as UserRole,
  },
  user: {
    name: process.env.SEED_USER_NAME || 'Utilizador Demo',
    email: process.env.SEED_USER_EMAIL || 'user@livesports.local',
    password: process.env.SEED_USER_PASSWORD || 'User12345!',
    role: 'user' as UserRole,
  },
  creator: {
    name: process.env.SEED_CREATOR_NAME || 'Criador Demo',
    email: process.env.SEED_CREATOR_EMAIL || 'creator@livesports.local',
    password: process.env.SEED_CREATOR_PASSWORD || 'Creator123!',
    role: 'creator' as UserRole,
    channelName: process.env.SEED_CREATOR_CHANNEL_NAME || 'Canal Demo LiveSports',
    channelSlug: process.env.SEED_CREATOR_CHANNEL_SLUG || 'canal-demo-livesports',
    channelDescription:
      process.env.SEED_CREATOR_CHANNEL_DESCRIPTION ||
      'Canal de demonstração para testar o Creator Studio, branding e gestão de transmissões.',
    sport: process.env.SEED_CREATOR_CHANNEL_SPORT || 'football',
    country: process.env.SEED_CREATOR_CHANNEL_COUNTRY || 'Portugal',
    websiteUrl: process.env.SEED_CREATOR_CHANNEL_WEBSITE || 'https://livesports.local/creator',
    avatar:
      process.env.SEED_CREATOR_CHANNEL_AVATAR ||
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80',
    banner:
      process.env.SEED_CREATOR_CHANNEL_BANNER ||
      'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1600&q=80',
  },
};

async function upsertUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const hashedPassword = bcrypt.hashSync(input.password, 12);

  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      password: hashedPassword,
      role: input.role,
      status: 'active' as UserStatus,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role,
      status: 'active' as UserStatus,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`✔ user ready: ${input.email} (${input.role})`);
  return user;
}

async function ensureCreatorChannel(userId: string) {
  const existingByUser = await prisma.$queryRawUnsafe<Array<{ id: string; slug: string }>>(
    `SELECT id, slug FROM channels WHERE user_id = $1 LIMIT 1`,
    userId,
  );

  if (existingByUser[0]) {
    await prisma.$executeRawUnsafe(
      `UPDATE channels
       SET name = $2,
           description = $3,
           avatar = $4,
           banner = $5,
           sport = $6,
           country = $7,
           website_url = $8,
           social_links = $9::jsonb,
           status = 'active',
           verified = TRUE,
           updated_at = NOW()
       WHERE user_id = $1`,
      userId,
      seedConfig.creator.channelName,
      seedConfig.creator.channelDescription,
      seedConfig.creator.avatar,
      seedConfig.creator.banner,
      seedConfig.creator.sport,
      seedConfig.creator.country,
      seedConfig.creator.websiteUrl,
      JSON.stringify({
        website: seedConfig.creator.websiteUrl,
        instagram: '@livesports_creator',
        youtube: '@livesportscreator',
      }),
    );
    console.log(`✔ creator channel updated for user ${userId}`);
    return;
  }

  const slugRows = await prisma.$queryRawUnsafe<Array<{ user_id: string | null }>>(
    `SELECT user_id FROM channels WHERE slug = $1 LIMIT 1`,
    seedConfig.creator.channelSlug,
  );

  const slug = slugRows[0] && slugRows[0].user_id !== userId
    ? `${seedConfig.creator.channelSlug}-${userId.slice(-6).toLowerCase()}`
    : seedConfig.creator.channelSlug;

  await prisma.$executeRawUnsafe(
    `INSERT INTO channels
      (user_id, name, slug, description, avatar, banner, sport, country, website_url, social_links, status, verified, subscriber_count, total_views, live_count)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, 'active', TRUE, 1250, 84210, 12)`,
    userId,
    seedConfig.creator.channelName,
    slug,
    seedConfig.creator.channelDescription,
    seedConfig.creator.avatar,
    seedConfig.creator.banner,
    seedConfig.creator.sport,
    seedConfig.creator.country,
    seedConfig.creator.websiteUrl,
    JSON.stringify({
      website: seedConfig.creator.websiteUrl,
      instagram: '@livesports_creator',
      youtube: '@livesportscreator',
    }),
  );

  console.log(`✔ creator channel created for user ${userId} (${slug})`);
}

async function main() {
  const admin = await upsertUser(seedConfig.admin);
  const user = await upsertUser(seedConfig.user);
  const creator = await upsertUser(seedConfig.creator);

  await ensureCreatorChannel(creator.id);

  console.log('\nSeed concluído:');
  console.log(`- admin:   ${admin.email} / ${seedConfig.admin.password}`);
  console.log(`- user:    ${user.email} / ${seedConfig.user.password}`);
  console.log(`- creator: ${creator.email} / ${seedConfig.creator.password}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
