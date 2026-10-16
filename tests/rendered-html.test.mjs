import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import test from 'node:test';

// Exercise built routes without database credentials or authenticated headers.
test('authentication boundary and standalone account screens', async (t) => {
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '0'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', OPENAI_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => { server.kill(); await once(server, 'exit'); });
  const base = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Server startup timed out: ${output}`)), 15000);
    server.on('error', reject);
    server.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/localhost:(\d+)/);
      if (match && output.includes('Ready')) { clearTimeout(timer); resolve(match[0]); }
    });
    server.stderr.on('data', chunk => { output += chunk; });
  });
  for (const path of ['/', '/debate-bot', '/videos']) {
    await t.test(`guest redirected from ${path}`, async () => {
      const response = await fetch(base + path, { redirect: 'manual' });
      assert.equal(response.status, 307);
      assert.equal(response.headers.get('location'), '/login');
    });
  }
  for (const path of ['/login', '/register']) {
    await t.test(`${path} is a standalone account page`, async () => {
      const response = await fetch(base + path);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, /autocomplete="username"/i);
      assert.match(html, /type="password"/);
      assert.doesNotMatch(html, /Main navigation|sidebar-toggle|Sign out/);
    });
  }
  for (const [path, body] of [
    ['/api/debate-bot', { motion: 'A test motion', side: 'for', argument: 'A sufficiently detailed argument for testing access.' }],
    ['/api/debate-bot/judge', { debateId: 'not-a-real-debate' }],
  ]) {
    await t.test(`guest denied API access to ${path}`, async () => {
      const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      assert.equal(response.status, 401);
    });
  }
  await t.test('logout clears session cookie', async () => {
    const response = await fetch(base + '/api/logout', { method: 'POST' });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie'), /debateLabSession=;/);
    assert.match(response.headers.get('set-cookie'), /Max-Age=0/i);
  });
});
