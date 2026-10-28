import { router } from "expo-router";
import { Alert } from "react-native";
import type { PlanLink } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { liveStoredDraft } from "@sendtally/features/log-session";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { planLinkParams } from "../training/data/planLinkParams";

function open(link: PlanLink | undefined, name: string | undefined): void {
  router.push({
    pathname: "/session/live",
    params: {
      ...(link === undefined ? {} : planLinkParams(link)),
      ...(name === undefined ? {} : { name }),
    },
  });
}

/**
 * Starts a new live session, linked to the plan and named after the workout when given. One
 * already running is replaced only once the climber agrees to discard it.
 */
export function startLiveSession(link?: PlanLink, name?: string): void {
  if (liveStoredDraft(liveSessionStorage, new Date()) === null) {
    open(link, name);
    return;
  }
  Alert.alert(t("tally.replaceTitle"), t("tally.replaceBody"), [
    { text: t("common.cancel"), style: "cancel" },
    {
      text: t("tally.replaceAction"),
      style: "destructive",
      onPress: () => {
        liveSessionStorage.remove();
        open(link, name);
      },
    },
  ]);
}
