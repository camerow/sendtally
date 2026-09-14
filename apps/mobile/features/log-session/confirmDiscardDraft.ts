import { Alert } from "react-native";
import type { StoredSessionDraft } from "@sendtally/features/log-session";
import { formatDate, t } from "@sendtally/features/i18n";

export function confirmDiscardDraft(
  { draft, savedAt }: StoredSessionDraft,
  onDiscard: () => void
): void {
  Alert.alert(
    t("common.discardDraftTitle"),
    t("common.discardDraftBody", {
      count: draft.climbs.length,
      day: formatDate(savedAt, { weekday: "long" }),
    }),
    [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.discard"), style: "destructive", onPress: onDiscard },
    ]
  );
}
