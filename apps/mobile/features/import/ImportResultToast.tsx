import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { t } from "@sendtally/features/i18n";
import { Toast } from "../../components/Toast";
import { useReminderPromptOpen } from "../training/reminders/ReminderPromptProvider";
import { importResultText } from "./importResultText";

/** What an import just added, from the params it came back with, with a way to see them. */
export function ImportResultToast(): React.ReactElement | null {
  const { imported, skipped, likely } = useLocalSearchParams<{
    imported?: string;
    skipped?: string;
    likely?: string;
  }>();
  const covered = useReminderPromptOpen();
  if (imported === undefined || covered) return null;
  const result = {
    imported: Number(imported),
    skipped: Number(skipped ?? 0),
    likely: Number(likely ?? 0),
  };
  return (
    <Toast
      message={importResultText(result)}
      {...(result.imported > 0 && {
        action: {
          label: t("common.view"),
          onPress: () =>
            router.push({ pathname: "/(tabs)/sessions", params: { segment: "climbing" } }),
        },
      })}
      onHide={() =>
        router.setParams({ imported: undefined, skipped: undefined, likely: undefined })
      }
    />
  );
}
