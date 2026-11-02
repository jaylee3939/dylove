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
    assert.deepEqual(s.memory, memories[i]);
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
  c.stages[4].memory.photos = ["/memories/garden.jpg"];
  assert.deepEqual(validateContent(c), c);
});
