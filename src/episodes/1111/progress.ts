import { EPISODE_SAVE_KEY, episode } from "./content.ts";
export type EpisodeProgress = {
  version: 2;
  screen: "title" | "play" | "ending";
  chapter: number;
  line: number;
  answers: Record<string, string>;
  hearts: number[];
  ceremony: number;
  dateChoice: string | null;
  envelopeOpen: boolean;
  muted: boolean;
};
export const emptyProgress: EpisodeProgress = {
  version: 2,
  screen: "title",
  chapter: 0,
  line: 0,
  answers: {},
  hearts: [],
  ceremony: 0,
  dateChoice: null,
  envelopeOpen: false,
  muted: false,
};
export function freshProgress(): EpisodeProgress {
  return { ...emptyProgress, answers: {}, hearts: [] };
}
export function chapterReady(p: EpisodeProgress) {
  const c = episode.chapters[p.chapter];
  if (!c || p.line < c.lines.length) return false;
  if (c.kind === "quiz")
    return c.quiz.every((q) => p.answers[q.id] === q.correctChoiceId);
  if (c.kind === "collect") return p.hearts.length === 11 && p.ceremony === 2;
  if (c.kind === "date")
    return !!c.choices?.some((choice) => choice.id === p.dateChoice);
  if (c.kind === "letter") return false;
  return true;
}
export function normalizeProgress(raw: unknown): EpisodeProgress {
  if (!raw || typeof raw !== "object") return freshProgress();
  const p = raw as any;
  if (p.version === 1) {
    if (
      !["title", "prologue", "overview"].includes(p.screen) ||
      !Number.isInteger(p.line) ||
      p.line < 0 ||
      p.line > 3 ||
      typeof p.muted !== "boolean"
    )
      return freshProgress();
    return {
      ...freshProgress(),
      muted: p.muted === true,
      screen: p.screen === "title" ? "title" : "play",
      chapter: p.screen === "overview" ? 1 : 0,
      line:
        p.screen === "prologue" && Number.isInteger(p.line)
          ? Math.max(0, Math.min(p.line, episode.chapters[0].lines.length))
          : 0,
    };
  }
  if (
    p.version !== 2 ||
    !["title", "play", "ending"].includes(p.screen) ||
    !Number.isInteger(p.chapter) ||
    p.chapter < 0 ||
    p.chapter >= episode.chapters.length ||
    !Number.isInteger(p.line) ||
    p.line < 0 ||
    p.line > episode.chapters[p.chapter].lines.length
  )
    return freshProgress();
  const answers: Record<string, string> = {};
  for (const c of episode.chapters)
    for (const q of c.quiz)
      if (p.answers?.[q.id] === q.correctChoiceId)
        answers[q.id] = q.correctChoiceId;
  const hearts = Array.isArray(p.hearts)
    ? [
        ...new Set<number>(
          p.hearts.filter(
            (id: unknown) =>
              Number.isInteger(id) && Number(id) >= 0 && Number(id) < 11,
          ),
        ),
      ]
    : [];
  const choice =
    episode.chapters[4].choices?.find((c) => c.id === p.dateChoice)?.id ?? null;
  const ceremony =
    hearts.length === 11 && Number.isInteger(p.ceremony)
      ? Math.max(0, Math.min(p.ceremony, 2))
      : 0;
  let chapter = p.chapter;
  for (let i = 1; i <= Math.min(chapter, 3); i++) {
    if (i === 1 && !episode.chapters[1].quiz.every((q) => answers[q.id])) {
      chapter = Math.min(chapter, 1);
      break;
    }
    if (i === 2 && !episode.chapters[2].quiz.every((q) => answers[q.id])) {
      chapter = Math.min(chapter, 2);
      break;
    }
  }
  if (chapter > 3 && (hearts.length !== 11 || ceremony !== 2)) chapter = 3;
  if (chapter > 4 && !choice) chapter = 4;
  const ending =
    p.screen === "ending" &&
    chapter === 5 &&
    hearts.length === 11 &&
    ceremony === 2 &&
    !!choice &&
    p.envelopeOpen === true;
  return {
    version: 2,
    screen: ending ? "ending" : p.screen === "title" ? "title" : "play",
    chapter,
    line: chapter === p.chapter ? p.line : 0,
    answers,
    hearts,
    ceremony,
    dateChoice: choice,
    envelopeOpen:
      chapter === 5 && p.envelopeOpen === true && hearts.length === 11,
    muted: p.muted === true,
  };
}
export function loadProgress(): EpisodeProgress {
  try {
    const raw = localStorage.getItem(EPISODE_SAVE_KEY);
    return raw ? normalizeProgress(JSON.parse(raw)) : freshProgress();
  } catch {
    return freshProgress();
  }
}
export function saveProgress(value: EpisodeProgress) {
  try {
    localStorage.setItem(EPISODE_SAVE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function collectHeart(p: EpisodeProgress, id: number): EpisodeProgress {
  if (
    p.chapter !== 3 ||
    p.line < episode.chapters[3].lines.length ||
    !Number.isInteger(id) ||
    id < 0 ||
    id >= 11 ||
    p.hearts.includes(id)
  )
    return p;
  return { ...p, hearts: [...p.hearts, id] };
}
export function nextChapter(p: EpisodeProgress): EpisodeProgress {
  if (!chapterReady(p) || p.chapter >= 5) return p;
  return { ...p, chapter: p.chapter + 1, line: 0 };
}
