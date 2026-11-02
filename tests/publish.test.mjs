import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  cp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createPhotoBundle } from "../src/content/photoBundle.ts";
import { zipSync, strToU8 } from "fflate";
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
    await mkdir(join(folder, "node_modules"), { recursive: true });
    await cp(
      new URL("../node_modules/fflate", import.meta.url),
      join(folder, "node_modules/fflate"),
      { recursive: true },
    );
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
    const png = new Uint8Array(
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0n0AAAAASUVORK5CYII=",
        "base64",
      ),
    );
    content.stages[0].memory.photos = [
      {
        id: "new-photo",
        src: "/memories/editor-test.png",
        title: "진짜 사진 제목 ♡",
        caption: "첫 줄\n두 번째 줄",
      },
    ];
    const zipInput = join(folder, "photos.zip");
    await writeFile(
      zipInput,
      createPhotoBundle(content, new Map([["/memories/editor-test.png", png]])),
    );
    const zipResult = spawnSync(process.execPath, [script, zipInput], {
      encoding: "utf8",
    });
    assert.equal(zipResult.status, 0, zipResult.stderr);
    assert.deepEqual(
      new Uint8Array(
        await readFile(join(folder, "public/memories/editor-test.png")),
      ),
      png,
    );
    assert.deepEqual(JSON.parse(await readFile(target, "utf8")), content);
    const badInput = join(folder, "bad.zip");
    await writeFile(
      badInput,
      zipSync({
        "content.json": strToU8(JSON.stringify(content)),
        "../outside.txt": strToU8("bad"),
      }),
    );
    assert.notEqual(spawnSync(process.execPath, [script, badInput]).status, 0);
    const different = new Uint8Array([...png, 0]);
    await writeFile(
      badInput,
      createPhotoBundle(
        content,
        new Map([["/memories/editor-test.png", different]]),
      ),
    );
    assert.notEqual(spawnSync(process.execPath, [script, badInput]).status, 0);
    assert.deepEqual(
      new Uint8Array(
        await readFile(join(folder, "public/memories/editor-test.png")),
      ),
      png,
    );
    await writeFile(join(folder, "outside.png"), png);
    await symlink(
      join(folder, "outside.png"),
      join(folder, "public/memories/editor-link.png"),
    );
    const linked = cloneContent();
    linked.stages[0].memory.photos = [
      {
        id: "linked",
        src: "/memories/editor-link.png",
        title: "링크",
        caption: "",
      },
    ];
    await writeFile(
      badInput,
      createPhotoBundle(linked, new Map([["/memories/editor-link.png", png]])),
    );
    assert.notEqual(spawnSync(process.execPath, [script, badInput]).status, 0);
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
