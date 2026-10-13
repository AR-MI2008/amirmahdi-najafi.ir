// Local-only production test server. Never uses deployment credentials or data.
import { spawn, execFileSync } from 'node:child_process';
import { createServer as createHttpsServer } from 'node:https';
import { request } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';
import { importContent } from '../../scripts/cms-import.mjs';
import { DatabaseSync } from 'node:sqlite';
const dir = mkdtempSync(join(tmpdir(), 'cms-e2e-'));
const key = join(dir, 'key.pem'),
  cert = join(dir, 'cert.pem'),
  database = join(dir, 'cms.sqlite');
execFileSync(
  'openssl',
  [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-keyout',
    key,
    '-out',
    cert,
    '-days',
    '1',
    '-subj',
    '/CN=localhost',
    '-addext',
    'subjectAltName=DNS:localhost,IP:127.0.0.1',
  ],
  { stdio: 'ignore' },
);
const salt = randomBytes(16);
const password = 'Local-CMS-E2E-only-2026!';
const stored = `${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`;
const db = new DatabaseSync(database);
for (const migration of [
  '0001_admin_cms.sql',
  '0002_admin_security.sql',
  '0003_public_content.sql',
])
  db.exec(readFileSync(join('database/migrations', migration), 'utf8'));
db.close();
chmodSync(database, 0o600);
importContent(database);
const app = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3107'],
  {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      CONTENT_SOURCE: 'sqlite',
      NEXT_PUBLIC_SITE_URL: 'https://amirmahdi-najafi.ir',
      RATE_LIMIT_PEPPER: randomBytes(32).toString('hex'),
      ADMIN_DATABASE_PATH: database,
      ADMIN_PASSWORD_SCRYPT: stored,
      ADMIN_TRUST_PROXY: 'true',
      ADMIN_ORIGIN: 'https://localhost:3447',
    },
    stdio: 'inherit',
  },
);
const proxy = createHttpsServer(
  { key: readFileSync(key), cert: readFileSync(cert) },
  (incoming, outgoing) => {
    const host = 'localhost:3447';
    const upstream = request(
      {
        hostname: '127.0.0.1',
        port: 3107,
        path: incoming.url,
        method: incoming.method,
        headers: {
          ...incoming.headers,
          host,
          'x-real-ip': incoming.socket.remoteAddress,
          'x-forwarded-host': host,
          'x-forwarded-proto': 'https',
          'x-forwarded-for': incoming.socket.remoteAddress,
        },
      },
      (response) => {
        outgoing.writeHead(response.statusCode, response.headers);
        response.pipe(outgoing);
      },
    );
    upstream.on('error', () => {
      outgoing.writeHead(503);
      outgoing.end('Test upstream is starting');
    });
    incoming.pipe(upstream);
  },
);
proxy.listen(3447, '127.0.0.1');
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  proxy.close();
  app.kill('SIGTERM');
  app.once('exit', () => {
    rmSync(dir, { recursive: true, force: true });
    process.exit();
  });
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
app.on('exit', (code) => {
  if (!stopping) {
    proxy.close();
    rmSync(dir, { recursive: true, force: true });
    process.exit(code ?? 1);
  }
});
