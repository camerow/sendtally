import { router } from "expo-router";
import { colors } from "@sendtally/design/tokens";
import { useClimbingInsights } from "@sendtally/features/climbs";
import { useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  pathCardCopy,
  SAMPLE_WEEK,
  setupCardQuery,
  useSettings,
  useSetupPaths,
  type OnboardingPath,
  type SetupPath,
} from "@sendtally/features/settings";
import { DarkWeek } from "../../../../components/DarkWeek";
import { Pyramid } from "../../../../components/Pyramid";
import { PyramidGhost } from "../../../../components/PyramidGhost";
import { SamplePyramid } from "../../../../components/SamplePyramid";
import type { SetupCard } from "../../../../components/SetupStack";
import { useApi } from "../../../../lib/api";
import { useSetupDismissed } from "../../../../lib/setupPrompt";
import { useStravaConnect } from "../../../settings/useStravaConnect";
import { useLocks } from "../../locks";
import { CircuitsArt } from "./CircuitsArt";
import { STRAVA_ORANGE, StravaArt } from "./StravaArt";

const ART_ROWS = 3;

const SAMPLE_DAYS = SAMPLE_WEEK.map((kind) => (kind === null ? null : [kind]));

/** The cards on Plan, in order: the two onboarding paths, then the gym and Strava. */
export function usePlanSetupCards(): SetupCard[] {
  const api = useApi();
  const prompts = {
    history: useSetupDismissed("history"),
    plan: useSetupDismissed("plan"),
  };
  const { paths, skip } = useSetupPaths(
    api,
    (p) => prompts[p].dismissed !== false,
    useLocks().create
  );
  const own = useClimbingInsights(api, "all").vm?.pyramid ?? [];
  const climbs = own.reduce((n, r) => n + r.inner + r.outer, 0);
  const settings = useSettings(api);
  const connect = useStravaConnect(api, settings.reload);
  const gyms = useGyms(api);
  const gymPrompt = useSetupDismissed("gym");
  const stravaPrompt = useSetupDismissed("strava");

  const open = (path: OnboardingPath): void => router.push(`/first-run${setupCardQuery(path)}`);
  const pathCard = ({ path, resume }: SetupPath): SetupCard => ({
    key: path,
    ...pathCardCopy(path, resume, climbs),
    art: {
      background: colors.gunmetal,
      content:
        path === "plan" ? (
          <DarkWeek week={SAMPLE_DAYS} />
        ) : !resume ? (
          <SamplePyramid rows={ART_ROWS} tone="dark" counts={false} />
        ) : own.length > 0 ? (
          <Pyramid label={t("trends.gradePyramid")} rows={own.slice(0, ART_ROWS)} tone="dark" />
        ) : (
          <PyramidGhost />
        ),
    },
    onAction: () => open(path),
    onDismiss: () => {
      if (resume) skip(path);
      prompts[path].dismiss();
    },
  });

  const cards = paths.map(pathCard);
  if (gyms.ready && gyms.gyms.length === 0 && gymPrompt.dismissed === false) {
    cards.push({
      key: "gym",
      eyebrow: t("gyms.gym"),
      title: t("gyms.setupTitle"),
      body: t("gyms.setupBody"),
      action: t("gyms.setupAction"),
      art: { background: colors.surfaceSoft, content: <CircuitsArt /> },
      onAction: () => router.push({ pathname: "/gym/[id]", params: { id: "new" } }),
      onDismiss: gymPrompt.dismiss,
    });
  }
  if (settings.ready && !settings.vm.stravaActive && stravaPrompt.dismissed === false) {
    const lapsed = settings.vm.stravaConnected;
    cards.push({
      key: "strava",
      eyebrow: lapsed ? t("sessions.setupEyebrowLapsed") : t("sessions.setupEyebrow"),
      title: lapsed ? t("sessions.setupLapsedTitle") : t("sessions.setupTitle"),
      body: lapsed ? t("sessions.setupLapsedBody") : t("sessions.setupBody"),
      action: connect.busy
        ? t("settings.openingStrava")
        : lapsed
          ? t("settings.relinkStrava")
          : t("sessions.connectStrava"),
      busy: connect.busy,
      error: connect.error,
      art: { background: STRAVA_ORANGE, content: <StravaArt /> },
      onAction: connect.connect,
      onDismiss: stravaPrompt.dismiss,
    });
  }
  return cards;
}
