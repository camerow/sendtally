import { router } from "expo-router";
import type { LogItem } from "@sendtally/features/journal";

export function openLogItem(item: LogItem): void {
  if (item.type === "session") {
    router.push({
      pathname: "/session/[fingerprint]",
      params: { fingerprint: item.session.fingerprint },
    });
  } else if (item.type === "entry") {
    router.push({ pathname: "/journal/[id]", params: { id: item.entry.id } });
  } else if (item.type === "block") {
    router.push({ pathname: "/plan/block/[id]", params: { id: item.recap.block.id } });
  } else {
    const id = item.type === "activity" ? item.activity.id : item.hang.id;
    router.push({ pathname: "/activity/[id]", params: { id } });
  }
}
