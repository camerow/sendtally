export type OnboardingSlide = {
  key: "log" | "effort" | "strava" | "trends";
  eyebrow: string;
  title: string;
  body: string;
};

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    key: "log",
    eyebrow: "LOG",
    title: "A session takes a minute to log.",
    body: "Date, times, grades in whichever scale you think in, sends and attempts, tries, and a name for the climb if you want one.",
  },
  {
    key: "effort",
    eyebrow: "EFFORT SCORE",
    title: "A big night should read like a big night.",
    body: "Every session is scored 1 to 10 against your own last eight weeks rather than a fixed scale, so the number says something about you.",
  },
  {
    key: "strava",
    eyebrow: "STRAVA",
    title: "One activity per session, never doubled.",
    body: "Each session posts as one Rock Climbing activity with the climb log and effort score in the description. Sessions are fingerprinted, so a re-sync never posts twice.",
  },
  {
    key: "trends",
    eyebrow: "TRENDS",
    title: "See what six months adds up to.",
    body: "Volume over time, grade pyramid, hardest send, flash rate, average grade. Logging and posting to Strava are free; membership adds the trends.",
  },
];

/** Membership sells the screens the log feeds, so it shows the same art for those two. */
export const MEMBER_SLIDES: OnboardingSlide[] = (["trends", "effort"] as const).flatMap((key) =>
  ONBOARDING_SLIDES.filter((slide) => slide.key === key)
);
