import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import test from 'node:test';
import ts from 'typescript';

test('topic library contains 50 unique motions and random selection respects its pool', async () => {
  const source = await readFile(new URL('../app/lib/debate-topics.ts', import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const { debateTopics, pickRandomTopic } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
  assert.equal(debateTopics.length, 50);
  assert.equal(new Set(debateTopics.map(topic => topic.id)).size, 50);
  assert.equal(new Set(debateTopics.map(topic => topic.motion)).size, 50);
  const juniors = debateTopics.filter(topic => topic.level === 'Junior');
  assert.ok(juniors.length > 0 && juniors.length < 50);
  assert.equal(pickRandomTopic(juniors, () => 0), juniors[0]);
  assert.equal(pickRandomTopic(juniors, () => .9999), juniors.at(-1));
  assert.throws(() => pickRandomTopic([]));
});

test('saved three-speech round, ownership and rewrite flow', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'debatelab-test-'));
  const hook = path.join(dir, 'mock-ai.mjs');
  // Only the child test process has this fake API. Production always calls OpenAI.
  await writeFile(hook, `
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (String(url) !== 'https://api.openai.com/v1/responses') return originalFetch(url, options);
  const body = JSON.parse(options.body);
  if (body.input[1].content.includes('FAIL_AI')) return new Response('{}', { status: 503 });
  const score = { structure:7, logic:7, evidence:7, rebuttal:7, speakingStyle:7, overall:70, rank:'70–72', feedback:'What worked: your school example.\\nNext step: explain the impact.\\nTry this: More time to rest helps pupils concentrate.' };
  const text = body.text ? JSON.stringify(score) : body.input[0].content.includes('Stage 3') ? 'Thanks for your conclusion. Our disagreement was about the cost.' : 'I see your point, but consider the cost. How would your plan help?';
  return Response.json({ status:'completed', output:[{ type:'message', content:[{ type:'output_text', text }] }] });
};`);
  const server = spawn(process.execPath, ['--import', pathToFileURL(hook).href, 'node_modules/next/dist/bin/next', 'start', '-p', '0'], {
    cwd: new URL('..', import.meta.url), stdio: ['ignore','pipe','pipe'],
    env: { ...process.env, SUPABASE_URL:'', NEXT_PUBLIC_SUPABASE_URL:'', SUPABASE_SERVICE_ROLE_KEY:'',
      DEBATELAB_TRUST_CHATGPT_HEADERS:'true', DEBATELAB_STORE_PATH:path.join(dir,'store.json'), OPENAI_API_KEY:'test-only' },
  });
  t.after(async () => { server.kill(); await once(server,'exit'); await rm(dir,{ recursive:true,force:true }); });
  const base = await new Promise((resolve,reject) => {
    let output=''; const timer=setTimeout(() => reject(new Error(output)),15000);
    server.stdout.on('data', chunk => { output+=chunk; const match=output.match(/http:\/\/localhost:\d+/); if(match && output.includes('Ready')) { clearTimeout(timer); resolve(match[0]); } });
    server.stderr.on('data',chunk => { output+=chunk; }); server.on('error',reject);
  });
  const headers = owner => ({ 'Content-Type':'application/json', 'oai-authenticated-user-id':owner, 'oai-authenticated-user-email':`${owner}@test.invalid` });
  async function request(endpoint, body, owner='test-pupil') {
    const response=await fetch(base+endpoint, { method: body ? 'POST':'GET', headers:headers(owner), ...(body ? { body:JSON.stringify(body) } : {}) });
    return { status:response.status, data:await response.json() };
  }
  const opening={ motion:'Secondary schools should start later.',side:'for',argument:'Pupils should start later because they need enough sleep to concentrate.' };
  const failed=await request('/api/debate-bot',{ ...opening,argument:'FAIL_AI This argument should fail without leaving a practice.' });
  assert.equal(failed.status,502);
  let result=await request('/api/debate-bot',opening);
  assert.equal(result.status,200); assert.equal(result.data.turns.length,2);
  const id=result.data.debate.id;
  const firstId=result.data.turns[0].id;
  assert.equal((await request(`/api/practices/${id}`,null,'another-pupil')).status,404);
  assert.equal((await request('/api/debate-bot',{ debateId:id,expectedTurns:2,argument:opening.argument },'another-pupil')).status,404);
  assert.equal((await request('/api/debate-bot/judge',{ debateId:id })).status,400);
  assert.equal((await request(`/api/practices/${id}/revision`,{ turnId:firstId,content:opening.argument })).status,400);
  // Two tabs race: exactly one exchange may be committed for step 2.
  const concurrent=await Promise.all([1,2].map(() => request('/api/debate-bot',{ debateId:id,expectedTurns:2,argument:'The extra cost is worthwhile because pupils can focus and learn more.' })));
  assert.deepEqual(concurrent.map(item => item.status).sort(),[200,409]);
  let saved=await request(`/api/practices/${id}`);
  assert.equal(saved.data.turns.length,4);
  result=await request('/api/debate-bot',{ debateId:id,expectedTurns:4,argument:'To answer your question, start with a trial. Better focus benefits every pupil.' });
  assert.equal(result.status,200); assert.equal(result.data.turns.length,6);
  assert.match(result.data.turns.at(-1).content,/Thanks for your conclusion/);
  assert.equal((await request('/api/debate-bot',{ debateId:id,expectedTurns:6,argument:opening.argument })).status,409);
  const judged=await request('/api/debate-bot/judge',{ debateId:id });
  assert.equal(judged.status,200); assert.equal(judged.data.score.overall,70);
  const repeated=await request('/api/debate-bot/judge',{ debateId:id });
  assert.equal(repeated.data.score.id,judged.data.score.id);
  assert.equal((await request(`/api/practices/${id}/revision`,{ turnId:firstId,content:opening.argument },'another-pupil')).status,404);
  const rewritten=await request(`/api/practices/${id}/revision`,{ turnId:firstId,content:'Later mornings help concentration because rested pupils can follow lessons. For example, they can finish more tasks.' });
  assert.equal(rewritten.status,200);
  saved=await request(`/api/practices/${id}`);
  assert.equal(saved.data.turns.length,6); assert.equal(saved.data.revisions.length,1);
  assert.equal(saved.data.score.overall,70); assert.equal(saved.data.debate.status,'judged');
  const journal=await fetch(base+'/practices',{ headers:headers('test-pupil') });
  const html=await journal.text();
  assert.match(html,/Secondary schools should start later/); assert.match(html,/Complete/); assert.match(html,/70[^]*?100/);
  const store=JSON.parse(await readFile(path.join(dir,'store.json'),'utf8'));
  assert.equal(store.debates.length,1); assert.equal(store.turns.length,6); assert.equal(store.revisions.length,1);
});
