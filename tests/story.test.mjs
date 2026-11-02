import test from "node:test";
import assert from "node:assert/strict";
import { stages, letter, heartMessages } from "../src/data/story.ts";
import { memories } from "../src/data/memories.ts";
test("six playable stages each have one reachable story event", () => {
  assert.equal(stages.length, 6);
  for (const s of stages) {
    assert.equal(s.spots.filter((p) => p.main).length, 1);
    assert.ok(s.intro.length > 0);
    for (const p of s.spots) {
      assert.ok(Math.abs(p.position[0]) <= 4);
      assert.ok(p.position[1] >= -5.5 && p.position[1] <= 5.4);
      assert.ok(p.lines.length);
    }
  }
});
test("choice stages have three distinct complete reactions", () => {
  for (const i of [1, 2, 3, 5]) {
    assert.equal(stages[i].choices.length, 3);
    assert.equal(
      new Set(stages[i].choices.map((c) => c.reply)).size,
      i === 2 ? 1 : 3,
    );
    for (const c of stages[i].choices) assert.ok(c.action && c.text && c.reply);
  }
});
test("letter preserves the requested exact wording", () => {
  assert.equal(
    letter,
    "도연아,\n\n너랑 함께하는 모든 순간이 좋아.\n\n같이 웃고, 장난치고,\n맛있는 걸 먹고,\n별거 아닌 하루를 함께 보내는 것도 좋아.\n\n앞으로도 우리 재밌게 사랑하자.\n\n항상 내가 더 많이 사랑할게.\n많이 예쁨 받아.\n넌 그래두 돼.\n\n사랑해, 도연아.\n\n- 재영이가 ♡",
  );
});
test("five hearts and editable photo entries match the story", () => {
  assert.equal(heartMessages.length, 5);
  assert.equal(memories.length, 6);
  assert.equal(memories[4].photos.length, 3);
  assert.ok(
    memories.every((m) =>
      m.photos.every((p) => p === null || p.startsWith("/memories/")),
    ),
  );
});
