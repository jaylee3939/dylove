import test from "node:test";
import assert from "node:assert/strict";
import { defaultEpisode } from "../src/episodes/1111/content.ts";
import { validateSpecial } from "../src/episodes/1111/schema.ts";
const copy = () => structuredClone(defaultEpisode);
test("special Korean edits roundtrip with quizzes, dates, photos, background and publication setting", () => {
  const d = copy();
  d.enabled = false;
  d.chapters[0].lines[0].text = "도연 ♡\n둘째 줄";
  d.chapters[1].quiz[0].correctChoiceId = "three";
  d.chapters[1].photos = [
    {
      id: "photo",
      src: "/memories/test.webp",
      title: "우리",
      caption: "부산 ♡",
    },
  ];
  d.chapters[1].background = "/memories/night.jpg";
  d.chapters[4].choices[0].reply = "또 가자";
  d.chapters[5].letter = "우리의 편지\n❤️";
  assert.deepEqual(
    validateSpecial(JSON.parse(JSON.stringify(d)), defaultEpisode),
    d,
  );
});
test("special rejects missing stages, invalid correct answers, unsafe image paths and changed mechanics", () => {
  for (const alter of [
    (d) => d.chapters.pop(),
    (d) => (d.chapters[1].quiz[0].correctChoiceId = "missing"),
    (d) => (d.chapters[1].background = "/../secret.png"),
    (d) => (d.chapters[3].targetHearts = 1),
    (d) => (d.chapters[0].lines = []),
    (d) => (d.enabled = "yes"),
  ]) {
    const d = copy();
    alter(d);
    assert.throws(() => validateSpecial(d, defaultEpisode));
  }
});
