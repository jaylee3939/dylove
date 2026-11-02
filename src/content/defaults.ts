import {
  stages,
  letter,
  heartMessages,
  easterEgg,
  reactionBubbles,
} from "../data/story.ts";
import { memories } from "../data/memories.ts";
import { defaultUI } from "./ui.ts";
export const stageIds = [
  "tokyo",
  "restaurant",
  "rings",
  "office",
  "garden",
  "hotel",
] as const;
export const stageLabels = [
  "도쿄",
  "옥된장",
  "동대문",
  "회사 탕비실",
  "사랑의 정원",
  "러브이즈호텔",
];
export const defaultContent = {
  version: 1,
  characters: { doyeon: "도연", jaeyeong: "재영" },
  stages: stages.map((stage, i) => ({
    id: stageIds[i],
    name: stage.name,
    subtitle: stage.subtitle,
    intro: [...stage.intro],
    spots: stage.spots.map((s) => ({
      id: s.id,
      label: s.label,
      lines: [...s.lines],
    })),
    choices: (stage.choices ?? []).map((c) => ({
      text: c.text,
      reply: c.reply,
    })),
    memory: { ...memories[i], photos: [...memories[i].photos] },
  })),
  ui: { ...defaultUI },
  letter,
  heartMessages: [...heartMessages],
  easterEgg,
  reactionBubbles: { ...reactionBubbles },
};
export type Content = typeof defaultContent;
export const cloneContent = (): Content =>
  JSON.parse(JSON.stringify(defaultContent));
export function resolveNames(text: string, names: Content["characters"]) {
  return text.replace(/도연|재영/g, (name) =>
    name === "도연" ? names.doyeon : names.jaeyeong,
  );
}
