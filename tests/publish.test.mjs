import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, cp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { cloneContent } from "../src/content/defaults.ts";
test("intentional publishing validates JSON and writes only the selected content file", async () => {
  const folder = await mkdtemp(join(tmpdir(), "doyeon-publish-"));
  try {
    await mkdir(join(folder, "src"), { recursive: true });
    await cp(
      new URL("../src/content", import.meta.url),
      join(folder, "src/content"),
      { recursive: true },
    );
    await cp(
      new URL("../src/data", import.meta.url),
      join(folder, "src/data"),
      { recursive: true },
    );
    await cp(new URL("../scripts", import.meta.url), join(folder, "scripts"), {
      recursive: true,
    });
    const content = cloneContent();
    content.stages[0].spots[0].lines[0] = "안녕, 도연아 ♡\n새로운 추억";
    content.letter = "새 편지\n\n사랑해 ♡";
    const input = join(folder, "input.json");
    await writeFile(input, JSON.stringify(content));
    const script = join(folder, "scripts/apply-content.mjs");
    const result = spawnSync(process.execPath, [script, input], {
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const target = join(folder, "src/content/published.json");
    assert.deepEqual(JSON.parse(await readFile(target, "utf8")), content);
    const before = await readFile(target, "utf8");
    await writeFile(input, '{"version":999}');
    assert.notEqual(spawnSync(process.execPath, [script, input]).status, 0);
    assert.equal(await readFile(target, "utf8"), before);
    assert.equal(
      await readFile(
        new URL("../src/content/published.json", import.meta.url),
        "utf8",
      ),
      "null\n",
    );
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
