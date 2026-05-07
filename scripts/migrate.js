const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const API_PROJ = path.join(ROOT, 'backend', 'src', 'AdminCore.API');

// Garante que as ferramentas .NET estejam no PATH (necessário no Linux)
const DOTNET_TOOLS = path.join(os.homedir(), '.dotnet', 'tools');
if (fs.existsSync(DOTNET_TOOLS)) {
  process.env.PATH = `${DOTNET_TOOLS}${path.delimiter}${process.env.PATH}`;
}

const MODULES = [
  { ctx: 'EntitiesDbContext', mod: 'backend/src/Modules/Entities/AdminCore.Modules.Entities' },
  { ctx: 'TenantsDbContext', mod: 'backend/src/Modules/Tenants/AdminCore.Modules.Tenants' },
  { ctx: 'AccessDbContext', mod: 'backend/src/Modules/Access/AdminCore.Modules.Access' },
  { ctx: 'ParametersDbContext', mod: 'backend/src/Modules/Parameters/AdminCore.Modules.Parameters' },
  { ctx: 'AuthDbContext', mod: 'backend/src/Modules/Auth/AdminCore.Modules.Auth' },
  { ctx: 'FormBuilderDbContext', mod: 'backend/src/Modules/FormBuilder/AdminCore.Modules.FormBuilder' },
];

// Verifica se dotnet-ef está disponível
function hasDotnetEf() {
  try {
    execSync('dotnet ef --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

if (!hasDotnetEf()) {
  console.error('✖  Ferramenta dotnet-ef não encontrada.');
  console.error('   Instale com: dotnet tool install --global dotnet-ef');
  console.error('   E verifique se ~/.dotnet/tools está no PATH.');
  process.exit(1);
}

function run(cmd, extraEnv = {}) {
  try {
    const env = { ...process.env, ...extraEnv };
    const output = execSync(cmd, { cwd: ROOT, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, env });
    // Filtra ruído: Wolverine extension scanning, avisos de versão
    const lines = output.split('\n').filter(line => {
      if (line.includes('Wolverine extension finding')) return false;
      if (line.includes('wolverinefx.net/guide/extensions')) return false;
      if (line.includes('BuildHost-netcore')) return false;
      if (line.includes('Entity Framework tools version') && line.includes('older than')) return false;
      if (line.includes('Update the tools for the latest features')) return false;
      return true;
    });
    const filtered = lines.join('\n').trim();
    if (filtered) console.log(filtered);
    return true;
  } catch (e) {
    console.error(`✖  Erro ao executar: ${cmd}`);
    if (e.stderr) console.error(e.stderr.toString());
    if (e.stdout) {
      const lines = e.stdout.split('\n').filter(line => {
        if (line.includes('Wolverine extension finding')) return false;
        if (line.includes('wolverinefx.net/guide/extensions')) return false;
        if (line.includes('BuildHost-netcore')) return false;
        return true;
      });
      const filtered = lines.join('\n').trim();
      if (filtered) console.error(filtered);
    }
    return false;
  }
}

let failures = 0;
let applied = 0;

for (const { ctx, mod } of MODULES) {
  const migrationsDir = path.join(ROOT, mod, 'Infrastructure', 'Migrations');
  const hasMigrations = fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).some(f => f.endsWith('.cs') && !f.includes('Designer'));

  if (!hasMigrations) {
    console.log(`  ○ ${ctx} — sem migrations, pulando`);
    continue;
  }

  console.log(`  → ${ctx}`);
  if (run(`dotnet ef database update --context ${ctx} -p ${mod} -s ${API_PROJ}`, { SKIP_WOLVERINE: '1' })) {
    applied++;
  } else {
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n⚠  Migrations: ${applied} ok, ${failures} falha(s)`);
} else {
  console.log(`✔  Migrations aplicadas (${applied})`);
}

// Limpa artefatos do BuildHost que o dotnet ef deixa no bin/.
// Eles causam spam do Wolverine ExtensionLoader no startup da API.
const buildHostDir = path.join(ROOT, 'backend', 'src', 'AdminCore.API', 'bin', 'Debug', 'net10.0', 'BuildHost-netcore');
if (fs.existsSync(buildHostDir)) {
  fs.rmSync(buildHostDir, { recursive: true, force: true });
}
