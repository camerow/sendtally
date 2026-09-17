import { account } from "./account";
import { appUpdate } from "./appUpdate";
import { auth } from "./auth";
import { billing } from "./billing";
import { climbs } from "./climbs";
import { common } from "./common";
import { endurance } from "./endurance";
import { gyms } from "./gyms";
import { importCsv } from "./importCsv";
import { journal } from "./journal";
import { logSession } from "./logSession";
import { onboarding } from "./onboarding";
import { projects } from "./projects";
import { sessionDetail } from "./sessionDetail";
import { sessions } from "./sessions";
import { settings } from "./settings";
import { trends } from "./trends";

export const es = {
  ...account,
  ...appUpdate,
  ...auth,
  ...billing,
  ...climbs,
  ...common,
  ...endurance,
  ...gyms,
  ...importCsv,
  ...journal,
  ...logSession,
  ...onboarding,
  ...projects,
  ...sessionDetail,
  ...sessions,
  ...settings,
  ...trends,
} as const;
