import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { isSpecial1111Path } from "../src/routes.ts";
import {
  episode,
  specialLetter,
  EPISODE_SAVE_KEY,
} from "../src/episodes/1111/content.ts";
import {
  freshProgress,
  normalizeProgress,
  saveProgress,
  loadProgress,
  chapterReady,
  collectHeart,
  nextChapter,
} from "../src/episodes/1111/progress.ts";
function finishDialogue(p) {
  return { ...p, line: episode.chapters[p.chapter].lines.length };
}
function reachHearts() {
  let p = finishDialogue({ ...freshProgress(), screen: "play" });
  p = nextChapter(p);
  p = finishDialogue(p);
  p.answers["busan-days"] = "one";
  p = finishDialogue(nextChapter(p));
  p.answers["favorite-food"] = "yeop";
  p.answers["legendary-bath"] = "meditation";
  return finishDialogue(nextChapter(p));
}
test("independent exact routes and all six chapters are playable contracts", () => {
  assert.ok(isSpecial1111Path("/special/1111"));
  assert.ok(isSpecial1111Path("/special/1111/"));
  for (const path of [
    "/",
    "/__editor",
    "/special/11111",
    "/special/1111/extra",
  ])
    assert.equal(isSpecial1111Path(path), false);
  assert.equal(episode.chapters.length, 6);
  assert.equal(new Set(episode.chapters.map((c) => c.id)).size, 6);
  assert.equal(episode.chapters[1].quiz[0].correctChoiceId, "one");
  assert.equal(episode.chapters[2].quiz[0].correctChoiceId, "yeop");
  assert.equal(episode.chapters[2].quiz[1].correctChoiceId, "meditation");
  const published = JSON.parse(
    readFileSync(
      new URL("../src/episodes/1111/published.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(
    episode.chapters[5].letter,
    published?.chapters[5].letter ?? specialLetter,
  );
  assert.ok(specialLetter.endsWith("사랑해. ❤️"));
});
test("dialogue and quiz gates cannot be skipped; wrong answers do not unlock stages", () => {
  let p = { ...freshProgress(), screen: "play" };
  assert.equal(nextChapter(p), p);
  p = nextChapter(finishDialogue(p));
  assert.equal(p.chapter, 1);
  assert.equal(nextChapter(finishDialogue(p)).chapter, 1);
  p = finishDialogue(p);
  p.answers["busan-days"] = "ten";
  assert.equal(chapterReady(p), false);
  p.answers["busan-days"] = "one";
  assert.equal(nextChapter(p).chapter, 2);
});
test("exactly eleven unique hearts and both affectionate interactions unlock the date", () => {
  let p = reachHearts();
  assert.equal(p.chapter, 3);
  assert.equal(collectHeart({ ...p, line: 0 }, 0).hearts.length, 0);
  for (let i = 0; i < 11; i++) {
    p = collectHeart(p, i);
    p = collectHeart(p, i);
  }
  assert.equal(p.hearts.length, 11);
  assert.equal(chapterReady(p), false);
  p = { ...p, ceremony: 1 };
  assert.equal(chapterReady(p), false);
  p = { ...p, ceremony: 2 };
  assert.equal(nextChapter(p).chapter, 4);
  for (const id of [-1, 11, 1.5]) assert.equal(collectHeart(p, id), p);
});
test("all four dates lead to the same intact letter and different promises", () => {
  const promises = new Set();
  for (const choice of episode.chapters[4].choices) {
    let p = reachHearts();
    for (let i = 0; i < 11; i++) p = collectHeart(p, i);
    p = finishDialogue(nextChapter({ ...p, ceremony: 2 }));
    assert.equal(chapterReady(p), false);
    p = { ...p, dateChoice: choice.id };
    p = nextChapter(p);
    assert.equal(p.chapter, 5);
    p = {
      ...p,
      line: episode.chapters[5].lines.length,
      envelopeOpen: true,
      screen: "ending",
    };
    assert.equal(normalizeProgress(p).screen, "ending");
    promises.add(choice.ending);
  }
  assert.equal(promises.size, 4);
});
test("reload sanitizes malformed state and migrates phase-one progress", () => {
  assert.equal(
    normalizeProgress({ version: 1, screen: "overview", line: 3, muted: true })
      .chapter,
    1,
  );
  assert.equal(
    normalizeProgress({ version: 1, screen: "prologue", line: 2, muted: false })
      .line,
    2,
  );
  assert.deepEqual(
    normalizeProgress({ version: 2, chapter: 999, screen: "play", line: 0 }),
    freshProgress(),
  );
  const cheated = {
    ...freshProgress(),
    chapter: 5,
    screen: "ending",
    envelopeOpen: true,
  };
  assert.notEqual(normalizeProgress(cheated).screen, "ending");
  let p = reachHearts();
  p.hearts = [0, 0, 1, 200, -1];
  const restored = normalizeProgress(p);
  assert.deepEqual(restored.hearts, [0, 1]);
  assert.equal(restored.ceremony, 0);
});
test("save and reset preserve original game and editor keys exactly", () => {
  const values = new Map([
    ["doyeon-love-v1", "main-sentinel"],
    ["doyeon-content-editor-v1", "editor-sentinel"],
  ]);
  globalThis.localStorage = {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
  };
  let p = reachHearts();
  p = collectHeart(p, 0);
  saveProgress(p);
  assert.deepEqual(loadProgress(), p);
  saveProgress(freshProgress());
  assert.equal(values.get("doyeon-love-v1"), "main-sentinel");
  assert.equal(values.get("doyeon-content-editor-v1"), "editor-sentinel");
  values.set(EPISODE_SAVE_KEY, "bad");
  assert.deepEqual(loadProgress(), freshProgress());
  delete globalThis.localStorage;
  assert.equal(saveProgress(p), false);
});
