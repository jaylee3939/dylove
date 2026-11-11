export const EXPLORE_SAVE_KEY = "doyeon-special-exploration-v1";
export const mapForChapter = (chapter: number) =>
  chapter < 2 ? 0 : chapter - 1 > 3 ? 3 : chapter - 1;
export const mapNames = [
  "부산 밤바다",
  "우리의 추억",
  "심장 쿵쾅",
  "11:11 SECRET ROOM",
];
export const heartPositions: [number, number][] = [
  [-3, 3],
  [0, 2],
  [3, 3],
  [-3, 0],
  [0, 0],
  [3, 0],
  [-3, -3],
  [0, -3],
  [3, -3],
  [-1.5, -4.7],
  [1.5, -4.7],
];
export type Mission = { id: string; title: string; x: number; z: number };
export function missionsForChapter(chapter: number): Mission[] {
  if (chapter === 0)
    return [{ id: "prologue", title: "재영이에게 말 걸기", x: 0, z: 2 }];
  if (chapter === 1)
    return [
      { id: "busan", title: "부산 여행 퀴즈", x: 0, z: -2 },
      { id: "photos", title: "우리의 부산 사진", x: 3, z: 1 },
    ];
  if (chapter === 2)
    return [
      { id: "favorite-food", title: "엽떡의 추억", x: -2.7, z: -1.5 },
      { id: "legendary-bath", title: "명상탕의 추억", x: 2.7, z: -1.5 },
    ];
  if (chapter === 3)
    return [{ id: "hearts", title: "재영이의 두근두근 미션", x: 0, z: 3 }];
  if (chapter === 4)
    return [{ id: "date", title: "다음 데이트 약속", x: -2, z: 0 }];
  return [{ id: "letter", title: "너에게 남긴 편지 봉투", x: 2, z: -2.5 }];
}
export function loadPosition(map: number): { x: number; z: number } {
  try {
    const p = JSON.parse(localStorage.getItem(EXPLORE_SAVE_KEY) || "null");
    if (
      p?.map === map &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.z) &&
      Math.abs(p.x) <= 4.7 &&
      Math.abs(p.z) <= 5.6
    )
      return { x: p.x, z: p.z };
  } catch {}
  return { x: 0, z: 4.8 };
}
export function walkable(map: number, x: number, z: number): boolean {
  if (
    map === 1 &&
    ((x > -3.95 && x < -1.45 && z > -3.5 && z < -1.95) ||
      (x > 1.35 && x < 4.2 && z > -4.25 && z < -1.95))
  )
    return false;
  if (map === 3 && x > -2 && x < 2 && z < -3.5) return false;
  return true;
}
