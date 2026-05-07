/**
 * AdminCore — Kill Ports
 *
 * Mata processos que estejam ocupando as portas do projeto.
 * Uso: node scripts/kill-ports.js [--db]
 */
const { execSync } = require('child_process');

const PORTS = {
  api: 5000,
  frontend: 4300,
  db: 5432
};

const includeDb = process.argv.includes('--db');

function killPort(port, label) {
  try {
    // tenta fuser primeiro (mais rápido, built-in no Linux)
    try {
      execSync(`fuser -k ${port}/tcp 2>/dev/null`, { stdio: 'pipe' });
      console.log(`  ✅ ${label} (porta ${port}) — processo encerrado`);
      return;
    } catch {
      // fuser retorna erro se não tem processo, ok
    }

    // fallback: lsof
    const out = execSync(`lsof -ti :${port} 2>/dev/null`, { encoding: 'utf-8', stdio: 'pipe' }).trim();
    if (!out) {
      console.log(`  ⬜ ${label} (porta ${port}) — já está livre`);
      return;
    }

    const pids = out.split('\n').filter(Boolean);
    for (const pid of pids) {
      execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
    }
    console.log(`  ✅ ${label} (porta ${port}) — ${pids.length} processo(s) encerrado(s)`);
  } catch {
    console.log(`  ⬜ ${label} (porta ${port}) — já está livre`);
  }
}

console.log('\n🔪 Matando processos nas portas do AdminCore...\n');

killPort(PORTS.api, 'API');
killPort(PORTS.frontend, 'Frontend');
if (includeDb) killPort(PORTS.db, 'PostgreSQL');

console.log('\n✨ Pronto. Execute `npm run dev` para subir novamente.\n');
