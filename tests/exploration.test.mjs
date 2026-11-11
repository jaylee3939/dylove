import test from "node:test";
import assert from "node:assert/strict";
import {
  mapForChapter,
  heartPositions,
  missionsForChapter,
  walkable,
  loadPosition,
  EXPLORE_SAVE_KEY,
} from "../src/episodes/1111/exploration.ts";
test("six existing story chapters share four exploration maps without changing progression", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(mapForChapter), [0, 0, 1, 2, 3, 3]);
  for (let i = 0; i < 6; i++) {
    assert.ok(missionsForChapter(i).length);
    for (const m of missionsForChapter(i))
      assert.ok(walkable(mapForChapter(i), m.x, m.z));
  }
});
test("eleven distinct spatial hearts are inside the walkable garden", () => {
  assert.equal(heartPositions.length, 11);
  assert.equal(new Set(heartPositions.map(String)).size, 11);
  for (const [x, z] of heartPositions) {
    assert.ok(Math.abs(x) < 4.5 && Math.abs(z) < 5.3);
    assert.ok(walkable(2, x, z));
  }
});
test("solid memory props and bed block walking while mission positions remain accessible", () => {
  assert.equal(walkable(1, -2.7, -2.6), false);
  assert.equal(walkable(1, 2.8, -3), false);
  assert.equal(walkable(3, 0, -4.2), false);
  assert.equal(walkable(3, 2, -2.5), true);
});
test("position save is independent, validated and never reads main or editor keys", () => {
  let value = null;
  globalThis.localStorage = {
    getItem: (k) => {
      assert.equal(k, EXPLORE_SAVE_KEY);
      return value;
    },
  };
  assert.deepEqual(loadPosition(0), { x: 0, z: 4.8 });
  value = JSON.stringify({ map: 2, x: 3, z: -3 });
  assert.deepEqual(loadPosition(2), { x: 3, z: -3 });
  assert.deepEqual(loadPosition(1), { x: 0, z: 4.8 });
  value = JSON.stringify({ map: 2, x: 999, z: 0 });
  assert.deepEqual(loadPosition(2), { x: 0, z: 4.8 });
  delete globalThis.localStorage;
});
