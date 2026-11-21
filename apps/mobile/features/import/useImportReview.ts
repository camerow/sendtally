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
import {
  CSV_TYPES,
  importAll,
  matchedCsv,
  requestColumns,
  type ColumnsReview,
} from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { useApi } from "../../lib/api";
import { errorMessage } from "@sendtally/features/query";

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
  /** A spreadsheet no export format reads, as the model matched its columns, before its review. */
  columns: ColumnsReview | null;
  matching: boolean;
  setColumns: (columns: ColumnsReview) => void;
  /** Reads the whole file with the match the user approved. */
  applyColumns: () => Promise<Review | null>;
  /** The sessions not flagged as likely already logged, and the ones the import will send. */
  unflagged: ImportSession[];
  importing: ImportSession[];
  /**
   * Picks a CSV and reads it on the phone; resolves to the review, the column match for a
   * spreadsheet, or null when cancelled.
   */
  pick: () => Promise<Review | ColumnsReview | null>;
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
  const [columns, setColumns] = React.useState<ColumnsReview | null>(null);
  const [matching, setMatching] = React.useState(false);
  const { unflagged, importing } = split(review);

  const read = async (fileName: string, text: string): Promise<Review> => {
    const plan = planImport(text, getCalendars()[0]?.timeZone ?? "UTC");
    const log = await api.sessionsWithClimbs();
    const duplicates = await likelyDuplicates(plan.sessions, log.sessions, (s) =>
      digestStringAsync(CryptoDigestAlgorithm.SHA256, s)
    );
    const next: Review = {
      fileName,
      plan,
      duplicates,
      importAnyway: false,
      busy: false,
      error: null,
    };
    setColumns(null);
    setReview(next);
    return next;
  };

  const pick = async (): Promise<Review | ColumnsReview | null> => {
    const picked = await File.pickFileAsync({ mimeTypes: CSV_TYPES });
    if (picked.canceled) return null;
    const { name } = picked.result;
    const text = await picked.result.text();
    const plan = planImport(text, "UTC");
    if (plan.sessions.length > 0 || plan.issues[0]?.code !== "noHeader") return read(name, text);
    setMatching(true);
    const matched = await requestColumns(api, text, name).finally(() => setMatching(false));
    if (matched === null) return read(name, text);
    setReview(null);
    setColumns(matched);
    return matched;
  };

  const applyColumns = async (): Promise<Review | null> =>
    columns === null ? null : read(columns.fileName, matchedCsv(columns));

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
        const message = errorMessage(error);
        setReview({ ...current, busy: false, error: t("import.failed", { message }) });
      }
    );
  };

  return {
    review,
    columns,
    matching,
    setColumns,
    applyColumns,
    unflagged,
    importing,
    pick,
    confirm,
    setImportAnyway: (importAnyway) => review !== null && setReview({ ...review, importAnyway }),
    clear: () => {
      setReview(null);
      setColumns(null);
    },
  };
}
