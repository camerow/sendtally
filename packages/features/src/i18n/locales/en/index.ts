import { account } from "./account";
import { areas } from "./areas";
import { appUpdate } from "./appUpdate";
import { auth } from "./auth";
import { billing } from "./billing";
import { climbs } from "./climbs";
import { common } from "./common";
import { endurance } from "./endurance";
import { gyms } from "./gyms";
import { hang } from "./hang";
import { importCsv } from "./importCsv";
import { journal } from "./journal";
import { logSession } from "./logSession";
import { onboarding } from "./onboarding";
import { projects } from "./projects";
import { sessionDetail } from "./sessionDetail";
import { sessions } from "./sessions";
import { settings } from "./settings";
import { statistics } from "./statistics";
import { trends } from "./trends";
import { training } from "./training";

export const en = {
  ...account,
  ...areas,
  ...appUpdate,
  ...auth,
  ...billing,
  ...climbs,
  ...common,
  ...endurance,
  ...gyms,
  ...hang,
  ...importCsv,
  ...journal,
  ...logSession,
  ...onboarding,
  ...projects,
  ...sessionDetail,
  ...sessions,
  ...settings,
  ...statistics,
  ...trends,
  ...training,
} as const;
