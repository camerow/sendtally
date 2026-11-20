import { z } from "zod";

export const ONBOARDING_PATHS = ["history", "plan"] as const;

export const ONBOARDING_STEPS = [
  "choose",
  "H1",
  "H2i",
  "H2s",
  "H3i",
  "H2h",
  "H4",
  "H5",
  "H6",
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "P7",
] as const;

const path = z.enum(ONBOARDING_PATHS);

export const onboardingSteps = [
  z.object({
    step: z.literal("path"),
    path,
    from: z.enum(["chooser", "setup_card", "account", "end_screen"]),
  }),
  z.object({ step: z.literal("left"), path }),
  z.object({ step: z.literal("skipped"), path: path.nullable(), at: z.enum(ONBOARDING_STEPS) }),
  z.object({
    step: z.literal("completed"),
    path,
    outcome: z.enum(["member", "later"]),
    next: z.enum(["other_path", "log", "live_session", "plan", "first_workout"]),
  }),
] as const;
