import type { SendtallyApi } from "@sendtally/api-client";
import { useClimbingInsights, type PyramidRow } from "@sendtally/features/climbs";
import { CIRCUIT_HEX, useGyms } from "@sendtally/features/gyms";
import { weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  historyNextLine,
  SAMPLE_PYRAMID,
  SAMPLE_WEEK,
  SETUP_CIRCUITS,
  setupCardQuery,
  useDisplayScales,
  useSetupPaths,
  type OnboardingPath,
} from "@sendtally/features/settings";
import { queries, useQuery } from "@sendtally/features/query";
import { displayGrade } from "@sendtally/features/sessions";
import { Pyramid } from "../../components/Pyramid";
import type { SetupCard } from "../../components/SetupStack";
import { useDismissed } from "../../lib/useDismissed";
import { GridCell } from "../components/GridCell";

const LIGHT = "var(--surface-soft)";
const STRAVA = "#fc4c02";

const pyramidArt = (rows: readonly PyramidRow[]): SetupCard["art"] => ({
  background: LIGHT,
  content: <Pyramid rows={rows} label={t("trends.gradePyramid")} />,
});

const planArt = (): SetupCard["art"] => ({
  background: LIGHT,
  content: (
    <span className="setup-week">
      {weekdayLetters().map((letter, i) => {
        const kind = SAMPLE_WEEK[i] ?? null;
        return (
          <span key={i} className="setup-week-day">
            <GridCell kind={kind ?? "strength"} on={kind !== null} label={letter} />
            <span className="setup-week-letter">{letter}</span>
          </span>
        );
      })}
    </span>
  ),
});

/** Plan's setup cards in order: the two onboarding paths, then a gym, then Strava. */
export function usePlanSetupCards(api: SendtallyApi): SetupCard[] {
  const prompt = { history: useDismissed("history"), plan: useDismissed("plan") };
  const { paths, skip } = useSetupPaths(api, (p) => prompt[p].dismissed !== false);
  const { vm } = useClimbingInsights(api, "all");
  const scales = useDisplayScales();
  const gyms = useGyms(api);
  const gymPrompt = useDismissed("gym");
  const stravaPrompt = useDismissed("strava");
  const { state } = useQuery(queries.status(api));
  const status = state.status === "ready" ? state.data : null;

  const sample = SAMPLE_PYRAMID.map((r) => ({
    gradeLabel: displayGrade({ scale: "v", value: r.value }, scales),
    inner: r.inner,
    outer: r.outer,
    countLabel: `${r.inner}/${r.inner + r.outer}`,
  }));
  const own = vm?.pyramid ?? [];
  const climbs = own.reduce((n, r) => n + r.inner + r.outer, 0);

  const pathCard = (path: OnboardingPath, resume: boolean): SetupCard => {
    const history = path === "history";
    const to = `/app/start${setupCardQuery(path)}`;
    const onDismiss = resume
      ? () => {
          skip(path);
          prompt[path].dismiss();
        }
      : prompt[path].dismiss;
    if (!resume) {
      return {
        key: path,
        eyebrow: history ? t("onboarding.history.card.soFar") : t("onboarding.plan.yourPlan"),
        title: history ? t("onboarding.chooser.historyTitle") : t("onboarding.chooser.planTitle"),
        body: history ? t("onboarding.history.setupBody") : t("onboarding.plan.setupBody"),
        action: t("onboarding.setup.start"),
        to,
        onDismiss,
        art: history ? pyramidArt(sample) : planArt(),
      };
    }
    return {
      key: path,
      eyebrow: history
        ? climbs > 0
          ? t("onboarding.setup.soFarCount", { count: climbs })
          : t("onboarding.history.card.soFar")
        : t("onboarding.plan.yourPlan"),
      title: t("onboarding.setup.finish"),
      body: history ? historyNextLine(climbs) : t("onboarding.plan.setupBody"),
      action: t("onboarding.firstRun.continue"),
      to,
      onDismiss,
      art: history ? pyramidArt(own.length > 0 ? own.slice(0, 3) : sample) : planArt(),
    };
  };

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
        background: LIGHT,
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
