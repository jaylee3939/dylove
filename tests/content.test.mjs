import test from "node:test";
import assert from "node:assert/strict";
import { defaultContent, cloneContent } from "../src/content/defaults.ts";
import { validateContent } from "../src/content/schema.ts";
import {
  stages,
  letter,
  heartMessages,
  easterEgg,
  reactionBubbles,
} from "../src/data/story.ts";
import { memories } from "../src/data/memories.ts";
test("all existing story and memories load without content loss", () => {
  const content = validateContent(cloneContent());
  assert.equal(content.stages.length, 6);
  assert.equal(content.letter, letter);
  assert.deepEqual(content.heartMessages, heartMessages);
  assert.equal(content.easterEgg, easterEgg);
  assert.deepEqual(content.reactionBubbles, reactionBubbles);
  content.stages.forEach((s, i) => {
    assert.equal(s.name, stages[i].name);
    assert.deepEqual(s.intro, stages[i].intro);
    assert.deepEqual(
      { ...s.memory, photos: s.memory.photos.map((p) => p.src) },
      memories[i],
    );
    assert.deepEqual(
      s.spots,
      stages[i].spots.map(({ id, label, lines }) => ({ id, label, lines })),
    );
    assert.deepEqual(
      s.choices,
      (stages[i].choices ?? []).map(({ text, reply }) => ({ text, reply })),
    );
  });
});
test("multi-stage Korean, emoji and newlines roundtrip exactly", () => {
  const content = cloneContent();
  content.stages[0].spots[0].lines[0] = '도연아 ♡\n\n"안녕!" 😏';
  content.stages[5].choices[0].text = "함께, 영원히 ♡";
  content.letter = "첫 줄\n\n마지막 줄 ♡";
  assert.deepEqual(
    validateContent(JSON.parse(JSON.stringify(content))),
    content,
  );
  assert.notDeepEqual(defaultContent, content);
});
test("reject malformed imports, missing stages, identifiers and extra fields", () => {
  for (const mutate of [
    (c) => c.stages.pop(),
    (c) => (c.stages[0].id = "hotel"),
    (c) => (c.stages[0].spots[0].id = "unknown"),
    (c) => c.stages[1].choices.pop(),
    (c) => (c.version = 99),
    (c) => (c.ui.bad = "extra"),
    (c) => (c.letter = null),
    (c) => (c.stages[4].memory.photos = ["https://example.com/a.jpg"]),
  ]) {
    const c = cloneContent();
    mutate(c);
    assert.throws(() => validateContent(c));
  }
  assert.throws(() => validateContent(null));
});
test("dialogue and photo lists can grow without losing untouched content", () => {
  const c = cloneContent();
  c.stages[0].spots[0].lines.push("다음 대사 ♡");
  c.stages[4].memory.photos = [
    {
      id: "garden-new",
      src: "/memories/garden.jpg",
      title: "새 추억",
      caption: "사진 설명 ♡",
    },
  ];
  assert.deepEqual(validateContent(c), c);
});

test("version 1 documents migrate without losing any copy or photo paths", () => {
  const v1 = cloneContent();
  v1.version = 1;
  delete v1.ui.text72;
  v1.stages.forEach(
    (s) => (s.memory.photos = s.memory.photos.map((p) => p.src)),
  );
  v1.stages[0].memory.photos = ["/memories/tokyo.jpg"];
  v1.stages[1].choices[0].text = "남겨둔 수정 ♡";
  const result = validateContent(v1);
  assert.equal(result.version, 2);
  assert.equal(result.ui.text72, defaultContent.ui.text72);
  assert.equal(result.stages[0].memory.photos[0].src, "/memories/tokyo.jpg");
  assert.equal(
    result.stages[0].memory.photos[0].title,
    v1.stages[0].memory.title,
  );
  assert.equal(result.stages[1].choices[0].text, "남겨둔 수정 ♡");
  assert.equal(result.letter, v1.letter);
});
test("per-photo captions, ordering, deletion and identifiers are validated", () => {
  const c = cloneContent();
  c.stages[0].memory.photos = [
    {
      id: "photo-a",
      src: "/memories/a.webp",
      title: "사진 제목 ♡",
      caption: "첫 줄\n둘째 줄",
    },
  ];
  assert.deepEqual(validateContent(c), c);
  c.stages[0].memory.photos = [];
  assert.deepEqual(validateContent(c), c);
  for (const src of [
    "/memories/../outside.jpg",
    "https://example.com/a.jpg",
    "data:image/png;base64,a",
    "/memories/a%2fb.jpg",
  ]) {
    const x = cloneContent();
    x.stages[0].memory.photos[0].src = src;
    assert.throws(() => validateContent(x));
  }
  const duplicate = cloneContent();
  duplicate.stages[1].memory.photos[0].id =
    duplicate.stages[0].memory.photos[0].id;
  assert.throws(() => validateContent(duplicate));
});
