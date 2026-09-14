import { billing } from "./billing";
import { climbs } from "./climbs";
import { common } from "./common";
import { logSession } from "./logSession";
import { mobileAccount } from "./mobileAccount";
import { mobileBilling } from "./mobileBilling";
import { mobileCommon } from "./mobileCommon";
import { mobileLogSession } from "./mobileLogSession";
import { mobileOnboarding } from "./mobileOnboarding";
import { mobileProjects } from "./mobileProjects";
import { mobileSessions } from "./mobileSessions";
import { mobileSettings } from "./mobileSettings";
import { mobileSignIn } from "./mobileSignIn";
import { mobileTabs } from "./mobileTabs";
import { mobileTrends } from "./mobileTrends";
import { sessionDetail } from "./sessionDetail";
import { sessions } from "./sessions";
import { settings } from "./settings";
import { trends } from "./trends";
import { webAuth } from "./webAuth";
import { webBilling } from "./webBilling";
import { webLogSession } from "./webLogSession";
import { webProjects } from "./webProjects";
import { webSessions } from "./webSessions";
import { webSettings } from "./webSettings";
import { webShell } from "./webShell";
import { webTrends } from "./webTrends";

export const en = {
  ...common,
  ...billing,
  ...climbs,
  ...logSession,
  ...mobileAccount,
  ...mobileBilling,
  ...mobileCommon,
  ...mobileLogSession,
  ...mobileOnboarding,
  ...mobileProjects,
  ...mobileSessions,
  ...mobileSettings,
  ...mobileSignIn,
  ...mobileTabs,
  ...mobileTrends,
  ...sessionDetail,
  ...sessions,
  ...settings,
  ...trends,
  ...webAuth,
  ...webBilling,
  ...webLogSession,
  ...webProjects,
  ...webSessions,
  ...webSettings,
  ...webShell,
  ...webTrends,
} as const;
