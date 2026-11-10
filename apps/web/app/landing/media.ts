const V3 = "/images/landing/v3";

export type Media = { kind: "still"; src: string } | { kind: "video"; src: string; poster: string };

const still = (name: string): Media => ({ kind: "still", src: `${V3}/${name}.webp` });
const video = (name: string): Media => ({
  kind: "video",
  src: `${V3}/${name}.mp4`,
  poster: `${V3}/${name}-poster.webp`,
});

export const MEDIA = {
  logClimbing: still("log-climbing"),
  liveTally: video("live-tally"),
  climbPage: still("climb-page"),
  block: still("block"),
  trainWorkouts: still("train-workouts"),
  plan: still("plan"),
  calendar: still("calendar"),
  setsPlayer: video("sets-player"),
  livebar: still("livebar"),
  hangTimer: video("hang-timer"),
  fingersProgress: still("fingers-progress"),
  statsClimbing: still("stats-climbing"),
  statsTraining: still("stats-training"),
} satisfies Record<string, Media>;

export type MediaKey = keyof typeof MEDIA;

export const PHOTOS = {
  sandstoneWall: "/images/landing/sandstone-wall.webp",
  desertCrag: "/images/landing/desert-crag.webp",
  pineFace: "/images/landing/pine-face.webp",
  limestoneWall: "/images/landing/limestone-wall.webp",
  willCameron: "/images/landing/will-cameron.webp",
};

export type PhotoKey = keyof typeof PHOTOS;
