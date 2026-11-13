import { File } from "expo-file-system";
import { getCalendars } from "expo-localization";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";
import { planImport, type ImportPlan } from "@sendtally/core/import";
import { importAll } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { ScreenFrame } from "../../components/ScreenFrame";
import { useApi } from "../../lib/api";
import { press } from "../../lib/press";
import { messageText, primaryButton, primaryButtonLabel } from "../../lib/styles";
import { Title } from "../training/components/Title";
import { ImportReview } from "./ImportReview";
import { NotRecognized } from "./NotRecognized";
import { SupportedApps } from "./SupportedApps";

type Review = { fileName: string; plan: ImportPlan; busy: boolean; error: string | null };

/** Import a climbing history: which apps' exports it reads, the file picked, then a review to confirm. */
export function ImportScreen(): React.ReactElement {
  const api = useApi();
  const [review, setReview] = React.useState<Review | null>(null);

  const pick = async (): Promise<void> => {
    const picked = await File.pickFileAsync({ mimeTypes: "text/csv" });
    if (picked.canceled) return;
    const timeZone = getCalendars()[0]?.timeZone ?? "UTC";
    const plan = planImport(await picked.result.text(), timeZone);
    setReview({ fileName: picked.result.name, plan, busy: false, error: null });
  };

  const confirm = async (current: Review): Promise<void> => {
    setReview({ ...current, busy: true, error: null });
    try {
      const { imported, skipped } = await importAll(api, current.plan.sessions);
      router.dismissTo({ pathname: "/profile", params: { imported, skipped } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setReview({ ...current, busy: false, error: t("import.failed", { message }) });
    }
  };

  const button = (label: string, onPress: () => void, busy = false): React.ReactElement => (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      style={press({ ...primaryButton, opacity: busy ? 0.45 : 1 })}
    >
      <Text style={primaryButtonLabel}>{label}</Text>
    </Pressable>
  );

  if (review === null) {
    return (
      <ScreenFrame
        backLabel={t("common.settings")}
        footer={button(t("import.chooseFile"), () => void pick())}
      >
        <Title size={34}>{t("import.title")}</Title>
        <SupportedApps />
      </ScreenFrame>
    );
  }

  const usable = review.plan.sessions.length > 0;
  return (
    <ScreenFrame
      backLabel={t("settings.importCsv")}
      onBack={() => !review.busy && setReview(null)}
      footer={
        usable ? (
          <>
            {review.error !== null && <Text style={messageText}>{review.error}</Text>}
            {button(
              review.busy
                ? t("import.importing")
                : t("import.confirm", { count: review.plan.sessions.length }),
              () => void confirm(review),
              review.busy
            )}
          </>
        ) : (
          button(t("import.chooseAnother"), () => void pick())
        )
      }
    >
      {usable ? (
        <ImportReview fileName={review.fileName} plan={review.plan} />
      ) : (
        <NotRecognized fileName={review.fileName} />
      )}
    </ScreenFrame>
  );
}
