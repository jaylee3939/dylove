import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Action } from "../data/story";
interface Game {
  stage: number;
  hearts: number[];
  completed: string[];
  album: number[];
  started: boolean;
  muted: boolean;
  action: Action;
  setStage: (n: number) => void;
  collect: () => void;
  complete: (id: string) => void;
  setAction: (a: Action) => void;
  start: () => void;
  toggleMute: () => void;
  reset: () => void;
}
export const useGame = create<Game>()(
  persist(
    (set, get) => ({
      stage: 0,
      hearts: [],
      completed: [],
      album: [],
      started: false,
      muted: false,
      action: "idle",
      setStage: (stage) => set({ stage, action: "idle" }),
      collect: () => {
        const { stage, hearts, album } = get();
        if (stage < 5)
          set({
            hearts: [...new Set([...hearts, stage])],
            album: [...new Set([...album, stage])],
          });
      },
      complete: (id) =>
        set((s) => ({ completed: [...new Set([...s.completed, id])] })),
      setAction: (action) => set({ action }),
      start: () => set({ started: true }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      reset: () =>
        set({
          stage: 0,
          hearts: [],
          completed: [],
          album: [],
          started: true,
          action: "idle",
        }),
    }),
    {
      name: "doyeon-love-v1",
      partialize: (s) => ({
        stage: s.stage,
        hearts: s.hearts,
        completed: s.completed,
        album: s.album,
        started: s.started,
        muted: s.muted,
      }),
    },
  ),
);
export const controls = {
  x: 0,
  z: 0,
  keys: new Set<string>(),
  position: { x: 0, z: 4 },
  blocked: true,
};
