import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SendtallyApi } from "@sendtally/api-client";
import type { CircuitColour } from "../gyms";
import { t } from "../i18n";
import { queries } from "../query";
import { nextUnlock } from "./historyCard";
import { resumeStep } from "./steps";
import type { OnboardingPath, OnboardingProgress, OnboardingStatus } from "./types";
import { patchStatus } from "./wizardState";

/** A path's card on Plan: Start, or Finish setting up for a path left mid-way. */
export type SetupPath = { path: OnboardingPath; resume: boolean };

/** The pyramid a path's art draws before the user has one: V grades, sent in the middle. */
export const SAMPLE_PYRAMID: readonly { value: number; inner: number; outer: number }[] = [
  { value: 6, inner: 1, outer: 0 },
  { value: 5, inner: 2, outer: 1 },
  { value: 4, inner: 4, outer: 0 },
  { value: 3, inner: 5, outer: 0 },
];

/** A training week for the plan path's art, Monday first. */
export const SAMPLE_WEEK: readonly ("strength" | "hangboard" | null)[] = [
  null,
  "strength",
  null,
  "strength",
  null,
  "hangboard",
  null,
];

/** The circuits the gym card's art shows. */
export const SETUP_CIRCUITS: readonly CircuitColour[] = [
  "green",
  "yellow",
  "orange",
  "blue",
  "red",
  "purple",
];

/** What the next climbs unlock, under the user's own pyramid on Finish setting up. */
export function historyNextLine(climbs: number): string {
  const next = nextUnlock(climbs);
  if (next === null) return t("onboarding.setup.historyMore");
  return "text" in next ? next.text : `${next.before}${next.more}${next.after}`;
}

/** The text of a path's card on Plan, Start or Finish setting up, with the climbs logged so far. */
export type PathCardCopy = { eyebrow: string; title: string; body: string; action: string };

export function pathCardCopy(path: OnboardingPath, resume: boolean, climbs: number): PathCardCopy {
  const history = path === "history";
  return {
    eyebrow: !history
      ? t("statistics.training")
      : resume && climbs > 0
        ? t("onboarding.setup.soFarCount", { count: climbs })
        : t("statistics.climbing"),
    title: resume
      ? t("onboarding.setup.finish")
      : history
        ? t("onboarding.chooser.historyTitle")
        : t("onboarding.chooser.planTitle"),
    body: !history
      ? t("onboarding.plan.setupBody")
      : resume
        ? historyNextLine(climbs)
        : t("onboarding.history.setupBody"),
    action: resume ? t("onboarding.firstRun.continue") : t("onboarding.setup.start"),
  };
}

const PATHS: readonly OnboardingPath[] = ["history", "plan"];

export const pathDone = (progress: OnboardingProgress, path: OnboardingPath): boolean =>
  path === "history" ? progress.sessions : progress.scheduledBlocks;

/** The path cards in order: Finish setting up while a path is left mid-way, otherwise Start until the path is done or Not now on this device. */
export function setupPaths(
  onboarding: OnboardingStatus,
  dismissed: (path: OnboardingPath) => boolean
): SetupPath[] {
  return PATHS.flatMap((path): SetupPath[] => {
    if (onboarding.left && onboarding.path === path) return [{ path, resume: true }];
    return pathDone(onboarding.progress, path) || dismissed(path) ? [] : [{ path, resume: false }];
  });
}

/** Where the wizard reopens for this path, as `/first-run` and `/app/start` read it. */
export const setupCardQuery = (path: OnboardingPath): string => `?path=${path}&from=setup_card`;

/** The path cards from the cached status, and Not now on a path left mid-way, which ends it on the server. */
export function useSetupPaths(
  api: SendtallyApi,
  dismissed: (path: OnboardingPath) => boolean
): { paths: SetupPath[]; skip: (path: OnboardingPath) => void } {
  const client = useQueryClient();
  const onboarding = useQuery(queries.status(api)).data?.onboarding ?? null;
  const skip = (path: OnboardingPath): void => {
    if (onboarding === null) return;
    const to = {
      step: "skipped",
      path,
      at: resumeStep(path, null, onboarding.progress, { membershipShown: false }, false),
    } as const;
    client.setQueryData(queries.status(api).queryKey, (s) => s && patchStatus(s, to));
    void api.firstRunStep(to).catch(() => undefined);
  };
  return {
    paths: onboarding === null ? [] : setupPaths(onboarding, dismissed),
    skip,
  };
}
