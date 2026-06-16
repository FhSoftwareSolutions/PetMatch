/**
 * Orquestrador de desenvolvimento do PetMatch.
 *
 * Sobe, num único comando (`npm run dev`), todos os serviços do monorepo com
 * logs combinados e coloridos:
 *   - MongoDB    (docker compose, em background)
 *   - motor IA   (FastAPI / uvicorn, usando o venv de recommendation-engine)
 *   - backend    (NestJS, nest start --watch)
 *   - web-app    (React + Vite)
 *
 * Não inclui o app mobile (Expo), que roda à parte por depender de um
 * dispositivo/emulador. Pressione Ctrl+C para encerrar todos os serviços.
 *
 * Usa apenas APIs nativas do Node — não precisa instalar nada.
 */

import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const isWin = process.platform === 'win32';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Python do venv do motor de recomendação (criado em recommendation-engine/.venv).
const venvPython = resolve(
  ROOT,
  'recommendation-engine',
  isWin ? '.venv/Scripts/python.exe' : '.venv/bin/python',
);

const RESET = '\x1b[0m';

/** Imprime uma linha com o prefixo colorido do serviço. */
function log(name, color, line) {
  process.stdout.write(`${color}[${name}]${RESET} ${line}\n`);
}

/** Sobe o MongoDB em background (detached) antes dos serviços de aplicação. */
function startDatabase() {
  return new Promise((done) => {
    log('db ', '\x1b[34m', 'subindo MongoDB (docker compose up -d)...');
    const p = spawn('docker compose up -d', {
      cwd: ROOT,
      shell: true,
      stdio: 'inherit',
    });
    p.on('exit', (code) => {
      log(
        'db ',
        '\x1b[34m',
        code === 0
          ? 'MongoDB no ar.'
          : `docker retornou ${code} (o Docker está rodando?). Seguindo assim mesmo.`,
      );
      done();
    });
    p.on('error', () => {
      log('db ', '\x1b[34m', 'docker não encontrado — pulei o MongoDB (o backend vai precisar dele).');
      done();
    });
  });
}

// Serviços de aplicação rodados em paralelo (cada um no seu diretório).
const services = [
  {
    name: 'ai ',
    color: '\x1b[35m',
    cmd: `"${venvPython}" -m uvicorn main:app --reload`,
    cwd: resolve(ROOT, 'recommendation-engine'),
    check: () => existsSync(venvPython),
    hint: 'crie o venv: cd recommendation-engine && python -m venv .venv && pip install -r requirements.txt',
  },
  {
    name: 'api',
    color: '\x1b[32m',
    cmd: 'npm run start:dev',
    cwd: resolve(ROOT, 'backend-api'),
    check: () => existsSync(resolve(ROOT, 'backend-api', 'node_modules')),
    hint: 'instale as deps: npm --prefix backend-api install',
  },
  {
    name: 'web',
    color: '\x1b[36m',
    cmd: 'npm run dev',
    cwd: resolve(ROOT, 'web-app'),
    check: () => existsSync(resolve(ROOT, 'web-app', 'node_modules')),
    hint: 'instale as deps: npm --prefix web-app install',
  },
];

const children = [];

/** Inicia um serviço, repassando seu stdout/stderr com o prefixo colorido. */
function startService(svc) {
  if (svc.check && !svc.check()) {
    log(svc.name, svc.color, `pulado — ${svc.hint}`);
    return;
  }
  const child = spawn(svc.cmd, { cwd: svc.cwd, shell: true });
  children.push(child);
  const onData = (buf) =>
    buf
      .toString()
      .split(/\r?\n/)
      .forEach((l) => {
        if (l.trim()) log(svc.name, svc.color, l);
      });
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('exit', (code) => log(svc.name, svc.color, `processo encerrado (code ${code})`));
  child.on('error', (err) => log(svc.name, svc.color, `erro ao iniciar: ${err.message}`));
}

let shuttingDown = false;
/** Encerra todos os serviços de aplicação (o MongoDB segue em background). */
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stdout.write('\nEncerrando serviços...\n');
  for (const child of children) {
    if (!child.pid || child.killed) continue;
    // No Windows é preciso matar a árvore de processos (cmd -> node/python).
    if (isWin) spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
    else child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 1500);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('\n🐾 PetMatch — subindo o ambiente de desenvolvimento\n');
await startDatabase();
services.forEach(startService);
console.log(
  '\n  web  → http://localhost:5173' +
    '\n  api  → http://localhost:3000' +
    '\n  ai   → http://localhost:8000' +
    '\n\n(Ctrl+C encerra os serviços. O MongoDB segue em background — pare com "npm run db:down".)' +
    '\n(O app mobile/Expo roda à parte: cd mobile-app && npm install && npm start.)\n',
);
