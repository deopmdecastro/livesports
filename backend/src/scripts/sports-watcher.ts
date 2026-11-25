#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import path from 'path';
import { ensureRuntimeSchema, prisma } from '../lib/prisma';
import { runSportsWatcherCycle, WATCHED_COMPETITIONS } from '../lib/sports-watcher';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface CliArgs {
  once: boolean;
  intervalSeconds: number;
  slugs: string[];
}

function parseCliArgs(argv: string[]): CliArgs {
  let once = false;
  let intervalSeconds = Number(process.env.SPORTS_WATCHER_INTERVAL_SEC || 180);
  const slugs: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--once' || arg === '-1') {
      once = true;
    } else if (arg.startsWith('--interval=')) {
      const val = Number(arg.split('=')[1]);
      if (Number.isFinite(val) && val >= 15) intervalSeconds = val;
    } else if (arg === '--interval' && argv[i + 1]) {
      const val = Number(argv[++i]);
      if (Number.isFinite(val) && val >= 15) intervalSeconds = val;
    } else if (arg.startsWith('--slug=')) {
      slugs.push(
        ...arg
          .split('=')[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
    } else if (arg === '--slug' && argv[i + 1]) {
      slugs.push(
        ...argv[++i]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }
  }

  return { once, intervalSeconds, slugs };
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  console.log('==================================================================');
  console.log('🏆 LiveSports · Daemon Contínuo de Competições, Tabelas & Grupos');
  console.log(
    `📊 Fontes monitorizadas: ESPN v2 Standings + ESPN Scoreboard + TheSportsDB + Feeds RSS`,
  );
  console.log(
    `🎯 Competições alvo: ${
      args.slugs.length > 0 ? args.slugs.join(', ') : `${WATCHED_COMPETITIONS.length} competições globais`
    }`,
  );
  console.log(
    `⏱️  Modo: ${args.once ? 'Execução única (--once)' : `Loop contínuo a cada ${args.intervalSeconds}s`}`,
  );
  console.log('==================================================================');

  await ensureRuntimeSchema();

  const executeCycle = async () => {
    const summary = await runSportsWatcherCycle({
      slugFilter: args.slugs.length > 0 ? args.slugs : undefined,
      includeLiveChannelsAndNews: true,
    });

    for (const r of summary.reports) {
      const statusBadge = r.error ? `❌ ERRO (${r.error})` : `✅ ${r.standingsSource}`;
      console.log(
        `   • [${r.sport.toUpperCase()}] ${r.name.padEnd(34)} | Formato: ${r.format.padEnd(8)} | Grupos/Tabelas: ${String(
          r.groupsCount,
        ).padStart(2)} (${String(r.teamsCount).padStart(2)} equipas) | Jogos: ${String(
          r.eventsUpserted,
        ).padStart(2)} | ${statusBadge}`,
      );
    }
  };

  await executeCycle();

  if (args.once) {
    await prisma.$disconnect();
    process.exit(0);
  }

  const timer = setInterval(() => {
    executeCycle().catch((err) => {
      console.error('[SportsWatcher CLI] Erro no ciclo:', err?.message || String(err));
    });
  }, args.intervalSeconds * 1000);

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 [SportsWatcher CLI] Sinal ${signal} recebido — a encerrar com segurança...`);
    clearInterval(timer);
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch(async (err) => {
  console.error('⛔ [SportsWatcher CLI] Falha crítica:', err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
