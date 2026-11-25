import type { SendtallyApi } from "@sendtally/api-client";
import { useClimbingInsights } from "@sendtally/features/climbs";
import { CIRCUIT_HEX, useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  pathCardCopy,
  SAMPLE_WEEK,
  SETUP_CIRCUITS,
  setupCardQuery,
  useSetupPaths,
  type OnboardingPath,
} from "@sendtally/features/settings";
import { queries, useQuery } from "@sendtally/features/query";
import { DarkWeek } from "../../components/DarkWeek";
import { Pyramid } from "../../components/Pyramid";
import { PyramidGhost } from "../../components/PyramidGhost";
import { SamplePyramid } from "../../components/SamplePyramid";
import type { SetupCard } from "../../components/SetupStack";
import { useDismissed } from "../../lib/useDismissed";
import { useLocks } from "../locks";

const STRAVA = "#fc4c02";

const DARK = "var(--bs-gunmetal)";

const SAMPLE_DAYS = SAMPLE_WEEK.map((kind) => (kind === null ? null : [kind]));

/** Plan's setup cards in order: the two onboarding paths, then a gym, then Strava. */
export function usePlanSetupCards(api: SendtallyApi): SetupCard[] {
  const prompt = { history: useDismissed("history"), plan: useDismissed("plan") };
  const { paths, skip } = useSetupPaths(
    api,
    (p) => prompt[p].dismissed !== false,
    useLocks().create
  );
  const { vm } = useClimbingInsights(api, "all");
  const gyms = useGyms(api);
  const gymPrompt = useDismissed("gym");
  const stravaPrompt = useDismissed("strava");
  const { state } = useQuery(queries.status(api));
  const status = state.status === "ready" ? state.data : null;

  const own = vm?.pyramid ?? [];
  const climbs = own.reduce((n, r) => n + r.inner + r.outer, 0);

  const pathCard = (path: OnboardingPath, resume: boolean): SetupCard => ({
    key: path,
    ...pathCardCopy(path, resume, climbs),
    to: `/app/start${setupCardQuery(path)}`,
    onDismiss: () => {
      if (resume) skip(path);
      prompt[path].dismiss();
    },
    art: {
      background: DARK,
      content:
        path === "plan" ? (
          <DarkWeek week={SAMPLE_DAYS} />
        ) : !resume ? (
          <SamplePyramid tone="dark" />
        ) : own.length > 0 ? (
          <Pyramid rows={own.slice(0, 3)} label={t("trends.gradePyramid")} tone="dark" />
        ) : (
          <PyramidGhost />
        ),
    },
  });

  const cards = paths.map((p) => pathCard(p.path, p.resume));
  if (gyms.ready && gyms.gyms.length === 0 && gymPrompt.dismissed === false) {
    cards.push({
      key: "gym",
      eyebrow: t("gyms.gym"),
      title: t("gyms.setupTitle"),
      body: t("gyms.setupBody"),
      action: t("gyms.setupAction"),
      to: "/app/settings/gyms/new",
      onDismiss: gymPrompt.dismiss,
      art: {
        background: "var(--surface-soft)",
        content: (
          <span className="setup-circuits">
            {SETUP_CIRCUITS.map((c) => (
              <span key={c} className="setup-circuit" style={{ background: CIRCUIT_HEX[c] }} />
            ))}
          </span>
        ),
      },
    });
  }
  const stravaConnected = status?.strava?.status === "active";
  const stravaLapsed = status?.strava != null && !stravaConnected;
  if (status !== null && !stravaConnected && stravaPrompt.dismissed === false) {
    cards.push({
      key: "strava",
      eyebrow: stravaLapsed ? t("sessions.setupEyebrowLapsed") : t("sessions.setupEyebrow"),
      title: stravaLapsed ? t("sessions.setupLapsedTitle") : t("sessions.setupTitle"),
      body: stravaLapsed ? t("sessions.setupLapsedBody") : t("sessions.setupBody"),
      action: stravaLapsed ? t("settings.relinkStrava") : t("sessions.connectStrava"),
      to: "/app/setup",
      onDismiss: stravaPrompt.dismiss,
      art: {
        background: STRAVA,
        content: (
          <span className="setup-strava">
            <span className="setup-strava-meta">{`Rock Climbing · ${t("training.today")}`}</span>
            <span className="setup-strava-name">{t("onboarding.setup.stravaArtName")}</span>
            <span className="setup-strava-rpe">RPE 7/10</span>
          </span>
        ),
      },
    });
  }
  return cards;
}
