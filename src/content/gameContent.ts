import { defaultContent, resolveNames } from "./defaults.ts";
import { validateContent } from "./schema.ts";
import published from "./published.json";
import { stages as originalStages, type Stage } from "../data/story";
const content =
  published === null ? defaultContent : validateContent(published);
const names = (text: string) => resolveNames(text, content.characters);
export const characters = content.characters;
export const stages: Stage[] = originalStages.map((stage, i) => {
  const draft = content.stages[i];
  return {
    ...stage,
    name: names(draft.name),
    subtitle: names(draft.subtitle),
    intro: draft.intro.map(names),
    spots: stage.spots.map((spot, j) => ({
      ...spot,
      label: names(draft.spots[j].label),
      lines: draft.spots[j].lines.map(names),
    })),
    ...(stage.choices
      ? {
          choices: stage.choices.map((choice, j) => ({
            ...choice,
            text: names(draft.choices[j].text),
            reply: names(draft.choices[j].reply),
          })),
        }
      : {}),
  };
});
export const memories = content.stages.map((s) => ({
  ...s.memory,
  title: names(s.memory.title),
  caption: names(s.memory.caption),
}));
export const ui = Object.fromEntries(
  Object.entries(content.ui).map(([key, value]) => [key, names(value)]),
) as typeof content.ui;
export const letter = names(content.letter);
export const heartMessages = content.heartMessages.map(names);
export const easterEgg = names(content.easterEgg);
export const reactionBubbles = {
  wave: names(content.reactionBubbles.wave),
  hands: names(content.reactionBubbles.hands),
  love: names(content.reactionBubbles.love),
};
