import { CryptoDigestAlgorithm, digestStringAsync } from "expo-crypto";
import { File } from "expo-file-system";
import { getCalendars } from "expo-localization";
import React from "react";
import type { ImportResult } from "@sendtally/api-client";
import {
  likelyDuplicates,
  planImport,
  type ImportPlan,
  type ImportSession,
  type LikelyDuplicate,
} from "@sendtally/core/import";
import { CSV_TYPES, importAll } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { useApi } from "../../lib/api";

export type Review = {
  fileName: string;
  plan: ImportPlan;
  duplicates: LikelyDuplicate[];
  importAnyway: boolean;
  busy: boolean;
  error: string | null;
};

export type ImportReviewFeature = {
  review: Review | null;
  /** The sessions not flagged as likely already logged, and the ones the import will send. */
  unflagged: ImportSession[];
  importing: ImportSession[];
  /** Picks a CSV and reads it on the phone; resolves to the review, or null when cancelled. */
  pick: () => Promise<Review | null>;
  confirm: (done: (result: ImportResult & { likely: number }) => void) => void;
  setImportAnyway: (importAnyway: boolean) => void;
  clear: () => void;
};

function split(review: Review | null): { unflagged: ImportSession[]; importing: ImportSession[] } {
  if (review === null) return { unflagged: [], importing: [] };
  const flagged = new Set(review.duplicates.map((d) => d.index));
  const unflagged = review.plan.sessions.filter((_, i) => !flagged.has(i));
  return { unflagged, importing: review.importAnyway ? review.plan.sessions : unflagged };
}

/** A climbing history file: picked, read on the phone against the log, then sent in batches. */
export function useImportReview(): ImportReviewFeature {
  const api = useApi();
  const [review, setReview] = React.useState<Review | null>(null);
  const { unflagged, importing } = split(review);

  const pick = async (): Promise<Review | null> => {
    const picked = await File.pickFileAsync({ mimeTypes: CSV_TYPES });
    if (picked.canceled) return null;
    const timeZone = getCalendars()[0]?.timeZone ?? "UTC";
    const plan = planImport(await picked.result.text(), timeZone);
    const log = await api.sessionsWithClimbs();
    const duplicates = await likelyDuplicates(plan.sessions, log.sessions, (text) =>
      digestStringAsync(CryptoDigestAlgorithm.SHA256, text)
    );
    const read: Review = {
      fileName: picked.result.name,
      plan,
      duplicates,
      importAnyway: false,
      busy: false,
      error: null,
    };
    setReview(read);
    return read;
  };

  const confirm = (done: (result: ImportResult & { likely: number }) => void): void => {
    if (review === null || review.busy) return;
    const current = review;
    setReview({ ...current, busy: true, error: null });
    importAll(api, importing, current.plan.format).then(
      (result) => {
        setReview({ ...current, busy: false });
        done({ ...result, likely: current.importAnyway ? 0 : current.duplicates.length });
      },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        setReview({ ...current, busy: false, error: t("import.failed", { message }) });
      }
    );
  };

  return {
    review,
    unflagged,
    importing,
    pick,
    confirm,
    setImportAnyway: (importAnyway) => review !== null && setReview({ ...review, importAnyway }),
    clear: () => setReview(null),
  };
}
