import published from "./published.json" with { type: "json" };
import { defaultEpisode, type EpisodeContent } from "./defaults.ts";
import { validateSpecial } from "./schema.ts";
export * from "./defaults.ts";
export const episode: EpisodeContent =
  published === null
    ? defaultEpisode
    : validateSpecial(published, defaultEpisode);
