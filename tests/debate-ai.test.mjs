import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../app/lib/debate-ai.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { generateBotReply, judgeDebate, reviewRevision } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const debate = { motion: 'Ban private schools', side: 'for' };
const turns = [{ speaker: 'user', content: 'Funding public schools reduces inequality.' }, { speaker: 'bot', content: 'A ban alone cannot improve public funding.' }];
const round = [...turns, ...turns, ...turns];
const score = { structure: 7, logic: 6, evidence: 5, rebuttal: 6, speakingStyle: 8, overall: 64, rank: 'Bronze I', feedback: 'Explain how the ban changes public school funding.' };
const response = (text, extra = {}) => ({ status: 'completed', output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text }] }], ...extra });

test('AI integration', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  t.after(() => { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey; });
  await t.test('missing key fails without making a request or returning a template', async () => {
    delete process.env.OPENAI_API_KEY;
    globalThis.fetch = () => { throw new Error('unexpected request'); };
    await assert.rejects(generateBotReply(debate, turns[0].content), /not configured/);
    await assert.rejects(judgeDebate(debate, round), /not configured/);
  });
  process.env.OPENAI_API_KEY = 'test-key';
  await t.test('bot reads actual REST output and sends debate context', async () => {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.openai.com/v1/responses');
      const body = JSON.parse(options.body);
      assert.equal(body.store, false);
      assert.match(body.input[1].content, /Funding public schools/);
      assert.match(body.input[1].content, /User side: for/);
      return Response.json(response('A ban alone cannot improve public funding.'));
    };
    assert.equal(await generateBotReply(debate, turns[0].content), turns[1].content);
  });
  await t.test('judge requests structured output and returns model scores', async () => {
    globalThis.fetch = async (_, options) => {
      const body = JSON.parse(options.body);
      assert.equal(body.text.format.strict, true);
      assert.equal(body.text.format.schema.additionalProperties, false);
      assert.match(body.input[1].content, /bot: A ban alone/);
      return Response.json(response(JSON.stringify(score)));
    };
    assert.deepEqual(await judgeDebate(debate, round), score);
  });
  await t.test('later replies receive history and stage-specific instructions', async () => {
    for (const [history, stage] of [[turns, 2], [[...turns, ...turns], 3]]) {
      globalThis.fetch = async (_, options) => {
        const body = JSON.parse(options.body);
        assert.match(body.input[0].content, new RegExp(`Stage ${stage}`));
        assert.match(body.input[0].content, /secondary school pupils/);
        assert.match(body.input[1].content, /bot: A ban alone/);
        return Response.json(response('A specific reply to your next speech.'));
      };
      await generateBotReply(debate, 'A further argument.', history);
    }
    await assert.rejects(generateBotReply(debate, 'another speech', round), /complete/);
  });
  await t.test('feedback requires three speeches and rewrites compare actual text', async () => {
    await assert.rejects(judgeDebate(debate, turns), /three speeches/);
    globalThis.fetch = async (_, options) => {
      const body = JSON.parse(options.body);
      assert.match(body.input[1].content, /Original: Funding/);
      assert.match(body.input[1].content, /Revision: Revised specific reasoning/);
      return Response.json(response('Your causal link is clearer. Add an example next.'));
    };
    assert.match(await reviewRevision(debate, turns[0], 'Revised specific reasoning'), /clearer/);
  });
  await t.test('API failures never produce substitute answers', async () => {
    for (const status of [401, 403, 429, 500]) {
      globalThis.fetch = async () => new Response('{}', { status });
      await assert.rejects(generateBotReply(debate, 'argument'));
      await assert.rejects(judgeDebate(debate, round));
    }
    globalThis.fetch = async () => { throw new DOMException('timeout', 'TimeoutError'); };
    await assert.rejects(generateBotReply(debate, 'argument'), /too long/);
  });
  await t.test('incomplete, refused and empty output are rejected', async () => {
    for (const body of [response('partial', { status: 'incomplete' }), response(''), { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] }]) {
      globalThis.fetch = async () => Response.json(body);
      await assert.rejects(generateBotReply(debate, 'argument'));
    }
  });
  await t.test('invalid judge data cannot become saved scores', async () => {
    for (const value of ['not json', 'null', '[]', '{}', JSON.stringify({ ...score, logic: 99 }), JSON.stringify({ ...score, evidence: '7' }), JSON.stringify({ ...score, feedback: '' })]) {
      globalThis.fetch = async () => Response.json(response(value));
      await assert.rejects(judgeDebate(debate, round));
    }
    await assert.rejects(judgeDebate(debate, [turns[0]]), /three speeches/);
  });
});
