const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const API_PROJ = path.join(ROOT, 'backend', 'src', 'AdminCore.API');

const MODULES = [
  { ctx: 'EntitiesDbContext', mod: 'backend/src/Modules/Entities/AdminCore.Modules.Entities' },
  { ctx: 'TenantsDbContext', mod: 'backend/src/Modules/Tenants/AdminCore.Modules.Tenants' },
  { ctx: 'AccessDbContext', mod: 'backend/src/Modules/Access/AdminCore.Modules.Access' },
  { ctx: 'ParametersDbContext', mod: 'backend/src/Modules/Parameters/AdminCore.Modules.Parameters' },
  { ctx: 'AuthDbContext', mod: 'backend/src/Modules/Auth/AdminCore.Modules.Auth' },
  { ctx: 'FormBuilderDbContext', mod: 'backend/src/Modules/FormBuilder/AdminCore.Modules.FormBuilder' },
];

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit', cwd: ROOT });
  } catch (e) {
    // ignora erros de migração para não quebrar o setup
    console.warn(`⚠  Comando falhou: ${cmd}`);
  }
}

for (const { ctx, mod } of MODULES) {
  const migrationsDir = path.join(ROOT, mod, 'Infrastructure', 'Migrations');
  const hasMigrations = fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).some(f => f.endsWith('.cs') && !f.includes('Designer'));

  if (!hasMigrations) {
    console.log(`  ○ ${ctx} — sem migrations, pulando`);
    continue;
  }

  console.log(`  → ${ctx}`);
  run(`dotnet ef database update --context ${ctx} -p ${mod} -s ${API_PROJ}`);
}

console.log('✔  Migrations aplicadas');
