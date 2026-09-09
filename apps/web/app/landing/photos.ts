export type LandingPhoto = {
  src: string;
  alt: string;
};

export const LANDING_PHOTOS = {
  hero: {
    src: "/images/landing/hero.jpg",
    alt: "A boulderer heel-hooking under a steep granite roof",
  },
  band: {
    src: "/images/landing/band.jpg",
    alt: "A climber small against a sweeping wall of red sandstone in a desert canyon",
  },
} satisfies Record<string, LandingPhoto>;
