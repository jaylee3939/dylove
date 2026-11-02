export type Action =
  "idle" | "wave" | "hug" | "kiss" | "pat" | "hands" | "run" | "sit";
export type Spot = {
  id: string;
  label: string;
  position: [number, number];
  lines: string[];
  main?: boolean;
};
export type Stage = {
  name: string;
  subtitle: string;
  color: string;
  sky: string;
  intro: string[];
  spots: Spot[];
  choices?: { text: string; reply: string; action: Action }[];
};
export const stages: Stage[] = [
  {
    name: "노을빛 도쿄",
    subtitle: "너와 걷던 골목",
    color: "#e5bca6",
    sky: "#efd1be",
    intro: ["도연아, 여기 기억나?", "천천히 걸어가 봐 ♡"],
    spots: [
      {
        id: "vending",
        label: "자판기",
        position: [-3, 1],
        lines: [
          "따뜻한 음료 하나, 네 손에 하나.",
          "네 손이 차가우면 내가 잡아줄게 ♡",
        ],
      },
      {
        id: "lamp",
        label: "가로등",
        position: [3, 0],
        lines: ["불빛이 켜지던 시간.", "그때도 지금도, 너는 참 예뻐."],
      },
      {
        id: "cafe",
        label: "작은 카페",
        position: [-3, -3],
        lines: ["잠깐 쉬었다 갈까?", "디저트는 반씩, 사랑은 두 배로 ㅎㅎ"],
      },
      {
        id: "photo",
        label: "사진 남기기",
        position: [0, -5],
        main: true,
        lines: ["도쿄에서도 네 옆에 있는 게 제일 좋았어."],
      },
    ],
  },
  {
    name: "옥된장의 저녁",
    subtitle: "마주 앉은 우리",
    color: "#b88765",
    sky: "#e5cbb0",
    intro: ["따뜻한 밥 냄새, 익숙한 웃음.", "재영이가 자리를 맡아뒀대 ♡"],
    spots: [
      {
        id: "menu",
        label: "오늘의 메뉴",
        position: [-3, 1],
        lines: [
          "보글보글 된장찌개에 밥 한 공기.",
          "맛있는 건 꼭 너랑 먹고 싶어.",
        ],
      },
      {
        id: "table",
        label: "재영이와 식사",
        position: [0, -3],
        main: true,
        lines: ["재영: 언니, 뭐 먹을래?"],
      },
    ],
    choices: [
      {
        text: "언니가 골라줘 ♡",
        reply: "재영: 그럼 제일 맛있는 걸로! 언니 취향은 내가 알지 ♡",
        action: "wave",
      },
      {
        text: "너랑 똑같은 거!",
        reply: "재영: 역시 우린 잘 맞아 ㅎㅎ 한 입 바꿔 먹자!",
        action: "hands",
      },
      {
        text: "일단 너부터 볼래 ㅎㅎ",
        reply: "재영: 아… 그렇게 보면 나 부끄럽잖아 ♡",
        action: "kiss",
      },
    ],
  },
  {
    name: "반짝이는 약속",
    subtitle: "동대문에서 고른 커플링",
    color: "#bea294",
    sky: "#e7d6c7",
    intro: ["작은 반지에 담은 큰 마음.", "우리 커플링을 골라볼까?"],
    spots: [
      {
        id: "mirror",
        label: "작은 거울",
        position: [3, 1],
        lines: [
          "같이 끼면 더 예쁠 것 같아.",
          "만든 게 아니라, 여기서 함께 골라 산 우리 반지 ♡",
        ],
      },
      {
        id: "rings",
        label: "커플링 고르기",
        position: [0, -4],
        main: true,
        lines: ["재영: 언니, 우리 이거 할까? ♡"],
      },
    ],
    choices: [
      {
        text: "은은한 실버 링",
        reply: "이제 우리 커플링도 생겼다!",
        action: "hands",
      },
      {
        text: "작은 별빛 링",
        reply: "이제 우리 커플링도 생겼다!",
        action: "hands",
      },
      {
        text: "따뜻한 골드 링",
        reply: "이제 우리 커플링도 생겼다!",
        action: "hands",
      },
    ],
  },
  {
    name: "우리만의 휴게실",
    subtitle: "평범한 하루의 비밀",
    color: "#b8bbb0",
    sky: "#e2dcd0",
    intro: ["바쁜 하루에도 잠깐, 우리 시간.", "커피 한 잔 하러 갈래?"],
    spots: [
      {
        id: "coffee",
        label: "커피 내리기",
        position: [-3, -1],
        lines: ["커피 향이 솔솔. 언니 것도 준비했어 ♡"],
      },
      {
        id: "fridge",
        label: "냉장고",
        position: [3, -3],
        lines: ["언니 좋아하는 음료, 여기 숨겨놨어 ㅎㅎ"],
      },
      {
        id: "jae",
        label: "재영이 부르기",
        position: [0, -4],
        main: true,
        lines: ["재영: 언니이이~", "도연: 왜애 ㅋㅋㅋ"],
      },
    ],
    choices: [
      {
        text: "안아주기",
        reply: "재영: 충전 완료. 이제 하루 더 버틸 수 있어 ♡",
        action: "hug",
      },
      {
        text: "머리 쓰다듬기",
        reply: "재영: 나 지금 완전 행복한 강아지 같지 ㅎㅎ",
        action: "pat",
      },
      {
        text: "뽀뽀하기",
        reply: "재영: 한 번만 더 하면 안 돼? ♡",
        action: "kiss",
      },
    ],
  },
  {
    name: "사랑이 피는 정원",
    subtitle: "언제나, 네 편",
    color: "#b3bc92",
    sky: "#edc6bc",
    intro: ["빛을 따라 천천히 걸어와 줘.", "널 기다리는 사람이 있어."],
    spots: [
      {
        id: "bench",
        label: "우리의 벤치",
        position: [-3, 0],
        lines: ["아무 말 없이 앉아 있어도 좋은 사람.", "나한텐 그게 너야."],
      },
      {
        id: "love",
        label: "재영이에게 가기",
        position: [0, -5],
        main: true,
        lines: [
          "재영: 김도연!",
          "재영: 드디어 왔네 ㅎㅎ",
          "재영: 나 너 진짜 많이 사랑해.",
        ],
      },
    ],
  },
  {
    name: "둘만의 밤",
    subtitle: "도연이만 입장 가능 ♡",
    color: "#774253",
    sky: "#684052",
    intro: ["황금 열쇠로 연 작은 비밀.", "오늘은 조금 더 가까이 ♡"],
    spots: [
      {
        id: "lamp",
        label: "조명 스위치",
        position: [3, 0],
        lines: ["빛을 조금 낮출까? 우리만 보이게 ♡"],
      },
      {
        id: "bed",
        label: "나란히 앉기",
        position: [-2, -3],
        lines: ["오늘도 내 옆자리는 언니 자리야 ♡"],
      },
      {
        id: "hotel",
        label: "재영이에게 다가가기",
        position: [0, -4],
        main: true,
        lines: ["재영: 언니, 여기 기억나? 😏"],
      },
    ],
    choices: [
      {
        text: "안아줘 ♡",
        reply: "재영: 이리 와. 오래 안아줄게 ♡",
        action: "hug",
      },
      { text: "뽀뽀해줘", reply: "재영: 눈 감아 봐, 언니 ♡", action: "kiss" },
      {
        text: "불 끌까? ㅎㅎ",
        reply: "그다음 이야기는 우리 둘만 아는 걸로 ♡",
        action: "sit",
      },
    ],
  },
];
export const letter =
  "도연아,\n\n너랑 함께하는 모든 순간이 좋아.\n\n같이 웃고, 장난치고,\n맛있는 걸 먹고,\n별거 아닌 하루를 함께 보내는 것도 좋아.\n\n앞으로도 우리 재밌게 사랑하자.\n\n항상 내가 더 많이 사랑할게.\n많이 예쁨 받아.\n넌 그래두 돼.\n\n사랑해, 도연아.\n\n- 재영이가 ♡";
export const heartMessages = [
  "첫 번째 추억 하트 획득! ♡",
  "두 번째 추억 하트 획득! ♡",
  "세 번째 추억 하트 획득! ♡",
  "네 번째 추억 하트 획득! ♡",
  "다섯 번째 추억 하트 획득! ♡",
];

export const easterEgg = "사실 커피보다 언니가 더 좋아 ㅎㅎ";
export const reactionBubbles = {
  wave: "언니! ♡",
  hands: "우리, 함께 ♡",
  love: "사랑해 ♡",
};
