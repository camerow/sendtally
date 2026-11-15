import { t } from "@sendtally/features/i18n";

export type OnboardingSlide = {
  key: "intro" | "exercises" | "workouts" | "blocks";
  eyebrow: string;
  title: string;
  body: string;
};

/** What sendtally is, then the three things it trains with, one slide each. */
export function onboardingSlides(): OnboardingSlide[] {
  return [
    {
      key: "intro",
      eyebrow: t("onboarding.intro.eyebrow"),
      title: t("onboarding.intro.title"),
      body: t("onboarding.intro.body"),
    },
    {
      key: "exercises",
      eyebrow: t("plan.tabExercises"),
      title: t("onboarding.exercises.title"),
      body: t("onboarding.exercises.body"),
    },
    {
      key: "workouts",
      eyebrow: t("plan.tabWorkouts"),
      title: t("onboarding.workouts.title"),
      body: t("onboarding.workouts.body"),
    },
    {
      key: "blocks",
      eyebrow: t("plan.tabBlocks"),
      title: t("onboarding.blocks.title"),
      body: t("onboarding.blocks.body"),
    },
  ];
}
