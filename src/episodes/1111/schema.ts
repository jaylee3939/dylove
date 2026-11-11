import type { EpisodeContent } from "./defaults";
const safePath = (x: unknown) =>
  typeof x === "string" &&
  /^\/memories\/[a-zA-Z0-9_-]+\.(webp|jpg|jpeg|png)$/.test(x);
export function validateSpecial(
  value: unknown,
  base: EpisodeContent,
): EpisodeContent {
  const fail = (): never => {
    throw Error(
      "스페셜 데이터 형식이 올바르지 않아요. 제목·대사·정답·사진을 확인해 주세요.",
    );
  };
  const data = JSON.parse(JSON.stringify(value)) as EpisodeContent;
  if (
    !data ||
    data.version !== 2 ||
    data.id !== "1111" ||
    (data.enabled !== undefined && typeof data.enabled !== "boolean")
  )
    fail();
  const text = (v: unknown) => {
    if (typeof v !== "string" || !v.trim() || v.length > 30000) fail();
  };
  for (const k of ["title", "subtitle", "tagline", "intro"] as const)
    text(data[k]);
  if (
    !Array.isArray(data.chapters) ||
    data.chapters.length !== base.chapters.length
  )
    fail();
  data.chapters.forEach((c, i) => {
    const old = base.chapters[i];
    if (
      !c ||
      c.id !== old.id ||
      c.kind !== old.kind ||
      c.scene !== old.scene ||
      c.targetHearts !== old.targetHearts
    )
      fail();
    text(c.title);
    text(c.description);
    if (c.background && !safePath(c.background)) fail();
    if (!Array.isArray(c.lines) || !c.lines.length || c.lines.length > 100)
      fail();
    c.lines.forEach((l) => {
      if (!l || !["jaeyeong", "doyeon"].includes(l.speaker)) fail();
      text(l.text);
    });
    if (!Array.isArray(c.quiz) || c.quiz.length !== old.quiz.length) fail();
    c.quiz.forEach((q, j) => {
      if (
        !q ||
        q.id !== old.quiz[j].id ||
        !Array.isArray(q.choices) ||
        q.choices.length !== old.quiz[j].choices.length
      )
        fail();
      text(q.question);
      text(q.correct);
      text(q.retry);
      q.choices.forEach((v, n) => {
        if (v.id !== old.quiz[j].choices[n].id) fail();
        text(v.text);
      });
      if (!q.choices.some((v) => v.id === q.correctChoiceId)) fail();
    });
    if (!Array.isArray(c.photos) || c.photos.length > 50) fail();
    c.photos.forEach((p) => {
      if (!p || !safePath(p.src)) fail();
      text(p.id);
      text(p.title);
      text(p.caption);
    });
    if (old.choices) {
      if (!Array.isArray(c.choices) || c.choices.length !== old.choices.length)
        fail();
      c.choices!.forEach((v, j) => {
        if (v.id !== old.choices![j].id || v.action !== old.choices![j].action)
          fail();
        text(v.text);
        text(v.reply);
        text(v.ending);
      });
    }
    if (old.letter) text(c.letter);
    c.reflections?.forEach((v) => {
      text(v.title);
      text(v.text);
    });
  });
  // Runtime-only mechanics are fixed; editable prose remains independent.
  data.coverMemory = base.coverMemory;
  data.reactions = base.reactions;
  return data;
}
export { safePath };
