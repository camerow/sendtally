import { t, upper } from "@sendtally/features/i18n";

export type OnboardingSlide = {
  key: "log" | "effort" | "strava" | "trends";
  eyebrow: string;
  title: string;
  body: string;
};

export function onboardingSlides(): OnboardingSlide[] {
  return [
    {
      key: "log",
      eyebrow: upper(t("mobile.onboarding.log.eyebrow")),
      title: t("mobile.onboarding.log.title"),
      body: t("mobile.onboarding.log.body"),
    },
    {
      key: "effort",
      eyebrow: upper(t("mobile.onboarding.effort.eyebrow")),
      title: t("mobile.onboarding.effort.title"),
      body: t("mobile.onboarding.effort.body"),
    },
    {
      key: "strava",
      eyebrow: upper(t("mobile.onboarding.strava.eyebrow")),
      title: t("mobile.onboarding.strava.title"),
      body: t("mobile.onboarding.strava.body"),
    },
    {
      key: "trends",
      eyebrow: upper(t("mobile.onboarding.trends.eyebrow")),
      title: t("mobile.onboarding.trends.title"),
      body: t("mobile.onboarding.trends.body"),
    },
  ];
}

/** Membership sells the screens the log feeds, so it shows the same art for those two. */
export function memberSlides(): OnboardingSlide[] {
  const all = onboardingSlides();
  return (["trends", "effort"] as const).flatMap((key) => all.filter((slide) => slide.key === key));
}
