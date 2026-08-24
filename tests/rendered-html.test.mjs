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
  assert.match(shell, /Close sidebar|Open sidebar/);
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

  assert.match(shell, /usePathname/);
  assert.match(shell, /next\/link/);
  assert.match(shell, /aria-current/);
  assert.match(shell, /href: "\/videos"/);
  assert.match(shell, /href: "\/debate-bot"/);
  assert.match(shell, /href: "\/debate-friend"/);
  assert.match(shell, /href: "\/championships"/);
  assert.match(shell, /href: "\/friends"/);
});

test("video lessons use playable embeds only where supported", async () => {
  const source = await readFile(
    new URL("../app/videos/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /youtube\.com\/embed/);
  assert.match(source, /Watch lesson/);
  assert.match(source, /video-thumb/);
});

test("starter preview references are removed", async () => {
  const [pageSource, layoutSource] = await Promise.all([
    readFile(page, "utf8"),
    readFile(layout, "utf8"),
  ]);

  assert.doesNotMatch(pageSource, /SkeletonPreview|_sites-preview/);
  assert.doesNotMatch(layoutSource, /Starter Project|codex-preview/);
});
