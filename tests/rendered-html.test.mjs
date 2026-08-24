import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = new URL("../app/page.tsx", import.meta.url);
const layout = new URL("../app/layout.tsx", import.meta.url);

test("home page contains the debate dashboard sections", async () => {
  const [source, shell, data] = await Promise.all([
    readFile(page, "utf8"),
    readFile(new URL("../app/SiteShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data.ts", import.meta.url), "utf8"),
  ]);

  assert.match(shell, /DebateLab/);
  assert.doesNotMatch(shell, /Your debate command center/);
  assert.match(source, /Profile/);
  assert.match(data, /Debates won/);
  assert.match(data, /Debates lost/);
  assert.match(source, /Friends/);
  assert.match(shell, /sidebar-toggle/);
  assert.match(shell, /sidebar-checkbox/);
  assert.doesNotMatch(source, /Judge decision/);
  assert.doesNotMatch(source, /Bot response|Current motion/);
});

test("championships page contains available championships", async () => {
  const source = await readFile(
    new URL("../app/championships/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Available championships/);
  assert.match(source, /Available now/);
});

test("sidebar links navigate to separate pages", async () => {
  const shell = await readFile(new URL("../app/SiteShell.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(shell, /usePathname/);
  assert.doesNotMatch(shell, /next\/link/);
  assert.match(shell, /href: "\/videos"/);
  assert.match(shell, /href: "\/debate-bot"/);
  assert.match(shell, /href: "\/debate-friend"/);
  assert.match(shell, /href: "\/championships"/);
  assert.match(shell, /href: "\/friends"/);
});

test("video lessons use embedded players", async () => {
  const source = await readFile(
    new URL("../app/videos/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /iframe/);
  assert.match(source, /video-embed/);
  assert.doesNotMatch(source, /Watch video/);
});

test("debate pages support voice recording", async () => {
  const [voice, botPage, friendPage] = await Promise.all([
    readFile(new URL("../app/VoiceArgumentBox.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/debate-bot/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/debate-friend/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(voice, /SpeechRecognition/);
  assert.match(voice, /Record speech/);
  assert.match(botPage, /VoiceArgumentBox/);
  assert.match(friendPage, /VoiceArgumentBox/);
});

test("starter preview references are removed", async () => {
  const [pageSource, layoutSource] = await Promise.all([
    readFile(page, "utf8"),
    readFile(layout, "utf8"),
  ]);

  assert.doesNotMatch(pageSource, /SkeletonPreview|_sites-preview/);
  assert.doesNotMatch(layoutSource, /Starter Project|codex-preview/);
});
