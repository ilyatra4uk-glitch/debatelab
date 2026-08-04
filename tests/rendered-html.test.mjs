import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = new URL("../app/page.tsx", import.meta.url);
const layout = new URL("../app/layout.tsx", import.meta.url);

test("home page contains the debate dashboard sections", async () => {
  const source = await readFile(page, "utf8");

  assert.match(source, /Your debate command center/);
  assert.match(source, /Profile/);
  assert.match(source, /Achievements/);
  assert.match(source, /Friends/);
  assert.match(source, /Available/);
  assert.match(source, /Judge decision/);
});

test("starter preview references are removed", async () => {
  const [pageSource, layoutSource] = await Promise.all([
    readFile(page, "utf8"),
    readFile(layout, "utf8"),
  ]);

  assert.doesNotMatch(pageSource, /SkeletonPreview|_sites-preview/);
  assert.doesNotMatch(layoutSource, /Starter Project|codex-preview/);
});
