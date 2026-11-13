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

const sha256Hex = (text: string): Promise<string> =>
  digestStringAsync(CryptoDigestAlgorithm.SHA256, text);

const importing = (review: Review): ImportPlan["sessions"] => {
  if (review.importAnyway) return review.plan.sessions;
  const flagged = new Set(review.duplicates.map((d) => d.index));
  return review.plan.sessions.filter((_, i) => !flagged.has(i));
};

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
    const duplicates = await likelyDuplicates(plan.sessions, log.sessions, sha256Hex);
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
      const sessions = importing(current);
      const { imported, skipped } = await importAll(api, sessions);
      const likely = current.plan.sessions.length - sessions.length;
      router.dismissTo({ pathname: "/profile", params: { imported, skipped, likely } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setReview({ ...current, busy: false, error: t("import.failed", { message }) });
    }
  };

  if (review === null) {
    return (
      <ScreenFrame
        backLabel={t("common.settings")}
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
  const count = importing(review).length;
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
          importAnyway={review.importAnyway}
          onImportAnyway={(importAnyway) => setReview({ ...review, importAnyway })}
        />
      ) : (
        <NotRecognized fileName={review.fileName} />
      )}
    </ScreenFrame>
  );
}
