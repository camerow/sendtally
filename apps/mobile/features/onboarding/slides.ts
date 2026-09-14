import { t } from "@sendtally/features/i18n";

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
      eyebrow: t("onboarding.log.eyebrow"),
      title: t("onboarding.log.title"),
      body: t("onboarding.log.body"),
    },
    {
      key: "effort",
      eyebrow: t("onboarding.effort.eyebrow"),
      title: t("onboarding.effort.title"),
      body: t("onboarding.effort.body"),
    },
    {
      key: "strava",
      eyebrow: "Strava",
      title: t("onboarding.strava.title"),
      body: t("onboarding.strava.body"),
    },
    {
      key: "trends",
      eyebrow: t("common.trends"),
      title: t("onboarding.trends.title"),
      body: t("onboarding.trends.body"),
    },
  ];
}

/** Membership sells the screens the log feeds, so it shows the same art for those two. */
export function memberSlides(): OnboardingSlide[] {
  const all = onboardingSlides();
  return (["trends", "effort"] as const).flatMap((key) => all.filter((slide) => slide.key === key));
}
