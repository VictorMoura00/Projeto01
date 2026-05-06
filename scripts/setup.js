const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FRONT_DIR = path.join(ROOT, 'frontend');

function run(cmd, opts = {}) {
  console.log(`▶  ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
}

function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

// 1. Criar .env se não existir
if (!exists('.env')) {
  if (exists('.env.example')) {
    fs.copyFileSync(path.join(ROOT, '.env.example'), path.join(ROOT, '.env'));
    console.log('✔  .env criado a partir de .env.example');
  } else {
    console.warn('⚠  .env.example não encontrado');
  }
} else {
  console.log('✔  .env já existe');
}

// 2. Subir PostgreSQL
console.log('▶  Iniciando PostgreSQL...');
run('docker compose -f docker-compose.dev.yml up -d --wait');
console.log('✔  PostgreSQL pronto');

// 3. Restore e build do backend
console.log('▶  Restaurando pacotes NuGet...');
run('dotnet restore backend/AdminCore.slnx');
console.log('✔  NuGet restore concluído');

console.log('▶  Buildando backend...');
run('dotnet build backend/AdminCore.slnx --no-restore');
console.log('✔  Build concluído');

// 4. Rodar migrations
console.log('▶  Aplicando migrations...');
require('./migrate.js');

// 4. Instalar dependências do frontend
if (!fs.existsSync(path.join(FRONT_DIR, 'node_modules'))) {
  console.log('▶  Instalando dependências do frontend...');
  run('npm install', { cwd: FRONT_DIR });
  console.log('✔  Dependências do frontend instaladas');
} else {
  console.log('✔  node_modules já existe');
}

// 5. Gerar environment.ts do frontend
console.log('▶  Gerando environment do frontend...');
run('npm run env', { cwd: FRONT_DIR });
console.log('✔  Environment gerado');

console.log('\n🚀 Setup completo! Rode \"npm run dev\" para iniciar.');
