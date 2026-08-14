import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const petStatusFiles = [
  process.env.DSH_PET_STATUS_FILE,
  path.resolve(process.env.USERPROFILE || process.env.HOME || '', '.dsh', 'pink-soul-dt', 'status.json'),
  path.resolve('.pet-state', 'status.json'),
  path.resolve('..', 'dsh-pet', '.state', 'status.json')
].filter(Boolean);

function gitInfoPlugin() {
  return {
    name: 'dsh-git-info',
    configureServer(server) {
      server.middlewares.use('/api/git-info', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        const run = (args) => execFileSync('git', args, { cwd: process.cwd(), encoding: 'utf8', timeout: 3000 }).trim();
        try {
          const branch = run(['branch', '--show-current']) || 'detached';
          const branches = run(['for-each-ref', '--format=%(refname:short)', 'refs/heads/']).split(/\r?\n/).filter(Boolean);
          const commits = run(['log', '-8', '--pretty=format:%h|%s|%an|%ar|%D']).split(/\r?\n/).filter(Boolean).map(line => {
            const [oid, subject, author, time, refs = ''] = line.split('|');
            const ref = refs.match(/(?:HEAD -> |origin\/)?([^,]+)/)?.[1] || branch;
            return { oid, subject, author, time, ref };
          });
          res.end(JSON.stringify({ ok: true, branch, branches: branches.length ? branches : [branch], commits }));
        } catch {
          res.end(JSON.stringify({ ok: false, branch: 'main', branches: ['main'], commits: [] }));
        }
      });
    }
  };
}

function petStatusPlugin() {
  return {
    name: 'dsh-pet-status',
    configureServer(server) {
      server.middlewares.use('/api/pet-status', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        try {
          const files = petStatusFiles
            .filter(candidate => fs.existsSync(candidate))
            .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
          const file = files[0];
          const data = file ? JSON.parse(fs.readFileSync(file, 'utf8')) : { mode: 'idle', message: '', updated: 0 };
          data.source = file || null;
          res.end(JSON.stringify(data));
        } catch {
          res.end(JSON.stringify({ mode: 'idle', message: '', updated: 0 }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), petStatusPlugin(), gitInfoPlugin()]
});

