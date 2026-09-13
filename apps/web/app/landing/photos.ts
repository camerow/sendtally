export type LandingPhoto = {
  src: string;
  alt: string;
};

export const LANDING_PHOTOS = {
  hero: {
    src: "/images/landing/hero-wall.webp",
    alt: "A climber high on a long limestone wall under clear sky",
  },
  band: {
    src: "/images/landing/band.jpg",
    alt: "A climber small against a sweeping wall of red sandstone in a desert canyon",
  },
} satisfies Record<string, LandingPhoto>;
