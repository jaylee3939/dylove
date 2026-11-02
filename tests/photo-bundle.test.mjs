import test from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import { cloneContent } from "../src/content/defaults.ts";
import {
  createPhotoBundle,
  readPhotoBundle,
} from "../src/content/photoBundle.ts";
const png = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0n0AAAAASUVORK5CYII=",
    "base64",
  ),
);
function sample() {
  const c = cloneContent();
  c.stages[0].memory.photos = [
    {
      id: "photo-new",
      src: "/memories/test.png",
      title: "우리의 사진 ♡",
      caption: "첫 줄\n둘째 줄",
    },
  ];
  c.stages[5].choices[0].reply = "내보내도 그대로 ♡";
  return c;
}
test("one ZIP roundtrips real image bytes, per-photo captions and all dialogue", () => {
  const c = sample(),
    zip = createPhotoBundle(c, new Map([["/memories/test.png", png]])),
    restored = readPhotoBundle(zip);
  assert.deepEqual(restored.content, c);
  assert.deepEqual(restored.images.get("/memories/test.png"), png);
  assert.equal(restored.images.size, 1);
});
test("ZIP refuses missing photos, fake image bytes and path traversal", () => {
  const c = sample();
  assert.throws(() => createPhotoBundle(c, new Map()));
  assert.throws(() =>
    createPhotoBundle(
      c,
      new Map([["/memories/test.png", strToU8("<script>bad()</script>")]]),
    ),
  );
  assert.throws(() =>
    readPhotoBundle(
      zipSync({
        "content.json": strToU8(JSON.stringify(c)),
        "../outside.txt": strToU8("bad"),
      }),
    ),
  );
  assert.throws(() =>
    readPhotoBundle(zipSync({ "content.json": strToU8(JSON.stringify(c)) })),
  );
  assert.throws(() =>
    readPhotoBundle(
      zipSync({
        "content.json": strToU8(JSON.stringify(c)),
        "public/memories/test.png": png,
        "public/memories/unused.png": png,
      }),
    ),
  );
});
test("ZIP rejects oversized expanded entries before allocating their contents", () => {
  assert.throws(() =>
    readPhotoBundle(
      zipSync({ "content.json": new Uint8Array(2_000_001) }, { level: 9 }),
    ),
  );
});
test("ZIP supports no photos after deletion while retaining all story content", () => {
  const c = cloneContent();
  c.stages.forEach((s) => (s.memory.photos = []));
  const restored = readPhotoBundle(createPhotoBundle(c, new Map()));
  assert.deepEqual(restored.content, c);
  assert.equal(restored.images.size, 0);
});
