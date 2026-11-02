import { router } from "expo-router";
import type { LoggedItem } from "@sendtally/features/training";

/** Opens what was logged: a hangboard session or activity on its screen, a climbing session on its own. */
export function openLogged(item: LoggedItem): void {
  if (item.kind === "hang")
    router.push({ pathname: "/activity/[id]", params: { id: item.session.id } });
  else if (item.kind === "activity")
    router.push({ pathname: "/activity/[id]", params: { id: item.activity.id } });
  else
    router.push({
      pathname: "/session/[fingerprint]",
      params: { fingerprint: item.session.fingerprint },
    });
}
