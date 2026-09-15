import { account } from "./account";
import { auth } from "./auth";
import { billing } from "./billing";
import { climbs } from "./climbs";
import { common } from "./common";
import { journal } from "./journal";
import { logSession } from "./logSession";
import { onboarding } from "./onboarding";
import { projects } from "./projects";
import { sessionDetail } from "./sessionDetail";
import { sessions } from "./sessions";
import { settings } from "./settings";
import { trends } from "./trends";

export const fr = {
  ...account,
  ...auth,
  ...billing,
  ...climbs,
  ...common,
  ...journal,
  ...logSession,
  ...onboarding,
  ...projects,
  ...sessionDetail,
  ...sessions,
  ...settings,
  ...trends,
} as const;
