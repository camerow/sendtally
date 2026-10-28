import { account } from "./account";
import { activities } from "./activities";
import { areas } from "./areas";
import { appUpdate } from "./appUpdate";
import { auth } from "./auth";
import { billing } from "./billing";
import { calendar } from "./calendar";
import { climbs } from "./climbs";
import { common } from "./common";
import { endurance } from "./endurance";
import { gyms } from "./gyms";
import { hang } from "./hang";
import { importCsv } from "./importCsv";
import { journal } from "./journal";
import { logSession } from "./logSession";
import { onboarding } from "./onboarding";
import { plan } from "./plan";
import { projects } from "./projects";
import { sessionDetail } from "./sessionDetail";
import { sessions } from "./sessions";
import { tally } from "./tally";
import { settings } from "./settings";
import { statistics } from "./statistics";
import { summary } from "./summary";
import { trends } from "./trends";
import { training } from "./training";
import { workouts } from "./workouts";

export const es = {
  ...account,
  ...activities,
  ...areas,
  ...appUpdate,
  ...auth,
  ...billing,
  ...calendar,
  ...climbs,
  ...common,
  ...endurance,
  ...gyms,
  ...hang,
  ...importCsv,
  ...journal,
  ...logSession,
  ...onboarding,
  ...plan,
  ...projects,
  ...sessionDetail,
  ...sessions,
  ...tally,
  ...settings,
  ...statistics,
  ...summary,
  ...trends,
  ...training,
  ...workouts,
} as const;
