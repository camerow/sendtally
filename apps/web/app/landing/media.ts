const V3 = "/images/landing/v3";

export type Media = { kind: "still"; src: string } | { kind: "video"; src: string; poster: string };

const still = (name: string): Media => ({ kind: "still", src: `${V3}/${name}.webp` });
const video = (name: string): Media => ({
  kind: "video",
  src: `${V3}/${name}.mp4`,
  poster: `${V3}/${name}-poster.webp`,
});

export const MEDIA = {
  heroLoop: video("hero-loop"),
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

export type Photo = { src: string; srcSet: string; sizes: string };

const photo = (name: string, widths: number[]): Photo => ({
  src: `/images/landing/${name}-${widths[0]}.webp`,
  srcSet: widths.map((w) => `/images/landing/${name}-${w}.webp ${w}w`).join(", "),
  sizes: "(max-width: 860px) 420px, 100vw",
});

export const PHOTOS = {
  sandstoneWall: photo("sandstone-wall", [1280, 1920]),
  desertCrag: photo("desert-crag", [1280, 1600]),
  pineFace: photo("pine-face", [1280, 1600]),
  limestoneWall: photo("limestone-wall", [1280, 1600]),
};

export type PhotoKey = keyof typeof PHOTOS;

export const PORTRAIT = "/images/landing/will-cameron.webp";
