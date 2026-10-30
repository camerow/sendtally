import { router } from "expo-router";
import { t } from "@sendtally/features/i18n";
import type { LogItem } from "@sendtally/features/journal";
import { openBlock } from "../training/blocks/openBlock";

export function openLogItem(item: LogItem): void {
  if (item.type === "session") {
    router.push({
      pathname: "/session/[fingerprint]",
      params: { fingerprint: item.session.fingerprint },
    });
  } else if (item.type === "entry") {
    router.push({ pathname: "/journal/[id]", params: { id: item.entry.id } });
  } else if (item.type === "block") {
    openBlock(item.recap.block.id, t("journal.log"));
  } else {
    const id = item.type === "activity" ? item.activity.id : item.hang.id;
    router.push({ pathname: "/activity/[id]", params: { id } });
  }
}
