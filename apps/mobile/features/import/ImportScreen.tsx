import { CryptoDigestAlgorithm, digestStringAsync } from "expo-crypto";
import { File } from "expo-file-system";
import { getCalendars } from "expo-localization";
import { router } from "expo-router";
import React from "react";
import { Text } from "react-native";
import {
  likelyDuplicates,
  planImport,
  type ImportPlan,
  type ImportSession,
  type LikelyDuplicate,
} from "@sendtally/core/import";
import { importAll } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { ScreenFrame } from "../../components/ScreenFrame";
import { useApi } from "../../lib/api";
import { messageText } from "../../lib/styles";
import { Button } from "../training/components/Button";
import { Title } from "../training/components/Title";
import { ImportReview } from "./ImportReview";
import { NotRecognized } from "./NotRecognized";
import { SupportedApps } from "./SupportedApps";

type Review = {
  fileName: string;
  plan: ImportPlan;
  duplicates: LikelyDuplicate[];
  importAnyway: boolean;
  busy: boolean;
  error: string | null;
};

function split(review: Review): { unflagged: ImportSession[]; importing: ImportSession[] } {
  const flagged = new Set(review.duplicates.map((d) => d.index));
  const unflagged = review.plan.sessions.filter((_, i) => !flagged.has(i));
  return { unflagged, importing: review.importAnyway ? review.plan.sessions : unflagged };
}

/** Import a climbing history: which apps' exports it reads, the file picked, then a review to confirm. */
export function ImportScreen(): React.ReactElement {
  const api = useApi();
  const [review, setReview] = React.useState<Review | null>(null);

  const pick = async (): Promise<void> => {
    const picked = await File.pickFileAsync({ mimeTypes: "text/csv" });
    if (picked.canceled) return;
    const timeZone = getCalendars()[0]?.timeZone ?? "UTC";
    const plan = planImport(await picked.result.text(), timeZone);
    const log = await api.sessionsWithClimbs();
    const duplicates = await likelyDuplicates(plan.sessions, log.sessions, (text) =>
      digestStringAsync(CryptoDigestAlgorithm.SHA256, text)
    );
    setReview({
      fileName: picked.result.name,
      plan,
      duplicates,
      importAnyway: false,
      busy: false,
      error: null,
    });
  };

  const confirm = async (current: Review): Promise<void> => {
    setReview({ ...current, busy: true, error: null });
    try {
      const { imported, skipped } = await importAll(api, split(current).importing);
      const likely = current.importAnyway ? 0 : current.duplicates.length;
      router.dismissTo({ pathname: "/profile", params: { imported, skipped, likely } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setReview({ ...current, busy: false, error: t("import.failed", { message }) });
    }
  };

  if (review === null) {
    return (
      <ScreenFrame
        footer={
          <Button variant="azure" label={t("import.chooseFile")} onPress={() => void pick()} />
        }
      >
        <Title size={34}>{t("import.title")}</Title>
        <SupportedApps />
      </ScreenFrame>
    );
  }

  const usable = review.plan.sessions.length > 0;
  const { unflagged, importing } = split(review);
  const count = importing.length;
  return (
    <ScreenFrame
      backLabel={t("settings.importCsv")}
      onBack={() => !review.busy && setReview(null)}
      footer={
        usable ? (
          <>
            {review.error !== null && <Text style={messageText}>{review.error}</Text>}
            <Button
              variant="azure"
              label={review.busy ? t("import.importing") : t("import.confirm", { count })}
              onPress={() => void confirm(review)}
              disabled={review.busy || count === 0}
            />
          </>
        ) : (
          <Button variant="azure" label={t("import.chooseAnother")} onPress={() => void pick()} />
        )
      }
    >
      {usable ? (
        <ImportReview
          fileName={review.fileName}
          plan={review.plan}
          duplicates={review.duplicates}
          unflagged={unflagged}
          importing={importing}
          importAnyway={review.importAnyway}
          onImportAnyway={(importAnyway) => setReview({ ...review, importAnyway })}
        />
      ) : (
        <NotRecognized fileName={review.fileName} />
      )}
    </ScreenFrame>
  );
}
