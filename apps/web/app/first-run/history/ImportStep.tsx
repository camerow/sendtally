import React from "react";
import {
  likelyDuplicates,
  planImport,
  type ImportPlan,
  type LikelyDuplicate,
} from "@sendtally/core/import";
import { Button } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import {
  columnsMatchedEvent,
  importAll,
  importSourceOf,
  matchedCsv,
  requestColumns,
  sheetMeta,
  type ColumnsReview,
} from "@sendtally/features/import";
import {
  firstRunSourceLabel,
  historyCard,
  importedInsights,
  useDisplayScales,
} from "@sendtally/features/settings";
import { ColumnMatch } from "../../import/components/ColumnMatch";
import { DropZone } from "../../import/components/DropZone";
import { ExportHowTo } from "../../import/components/ExportHowTo";
import { ImportReview } from "../../import/components/ImportReview";
import { sha256Hex } from "../../import/sha256Hex";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { HistoryCard } from "./components/HistoryCard";
import { WhatYouGet } from "./components/WhatYouGet";
import { errorMessage } from "@sendtally/features/query";

type Review = {
  fileName: string;
  plan: ImportPlan;
  duplicates: LikelyDuplicate[];
  importAnyway: number[];
  busy: boolean;
  error: string | null;
};

const heldBack = (review: Review): number[] =>
  review.duplicates.map((d) => d.index).filter((i) => !review.importAnyway.includes(i));

const yearsIn = (plan: ImportPlan): number => {
  const years = plan.sessions.map((s) => Number(s.date.slice(0, 4)));
  return Math.max(...years) - Math.min(...years) + 1;
};

/**
 * H2i and H3i in one: how to get the export out, then the file read in the browser and drawn as
 * the user's climbing before anything is saved. One component, so the file survives the step.
 */
export const ImportStep: StepComponent = ({ wizard, api }) => {
  const scales = useDisplayScales();
  const [review, setReview] = React.useState<Review | null>(null);
  const [columns, setColumns] = React.useState<ColumnsReview | null>(null);
  const [matching, setMatching] = React.useState(false);
  const answer = wizard.memory.existingLog;
  const source = answer === null ? undefined : importSourceOf(answer);

  const read = async (fileName: string, text: string): Promise<void> => {
    const plan = planImport(text, Intl.DateTimeFormat().resolvedOptions().timeZone);
    const log = await api.sessionsWithClimbs();
    const duplicates = await likelyDuplicates(plan.sessions, log.sessions, sha256Hex);
    setColumns(null);
    setReview({
      fileName,
      plan,
      duplicates,
      importAnyway: [],
      busy: false,
      error: null,
    });
    wizard.capture("import_reviewed", {
      format: plan.format,
      sessions: plan.sessions.length,
      issues: plan.issues.length,
      duplicates: duplicates.length,
    });
  };

  const choose = async (file: File): Promise<void> => {
    const text = await file.text();
    const plan = planImport(text, "UTC");
    if (plan.sessions.length === 0 && plan.issues[0]?.code === "noHeader") {
      setMatching(true);
      const matched = await requestColumns(api, text, file.name).finally(() => setMatching(false));
      if (matched !== null) {
        setReview(null);
        setColumns(matched);
      } else await read(file.name, text);
    } else await read(file.name, text);
    if (wizard.step === "H2i") wizard.next({ way: "import" });
  };

  const byHand = (
    <button
      type="button"
      className="history-link"
      onClick={() => {
        wizard.setWay("by_hand");
        wizard.next({ way: "by_hand" });
      }}
    >
      {t("onboarding.history.how.byHand")}
    </button>
  );

  if (wizard.step !== "H2i" && columns !== null)
    return (
      <WizardFrame
        wizard={wizard}
        footer={
          <Button
            variant="azure"
            onClick={() => {
              wizard.capture("import_columns_matched", columnsMatchedEvent(columns, "matched"));
              void read(columns.fileName, matchedCsv(columns));
            }}
          >
            {t("import.match.confirm")}
          </Button>
        }
      >
        <div className="history-head">
          <span className="history-kicker">{firstRunSourceLabel("spreadsheet")}</span>
          <h1 className="wizard-title">{t("import.match.title")}</h1>
          <span className="history-meta">{sheetMeta(columns)}</span>
        </div>
        <ColumnMatch review={columns} onChange={setColumns} />
      </WizardFrame>
    );

  if (wizard.step === "H2i" || review === null)
    return (
      <WizardFrame wizard={wizard} footer={byHand}>
        <div className="history-head">
          {source !== undefined && (
            <span className="history-kicker">{firstRunSourceLabel(source)}</span>
          )}
          <h1 className="wizard-title">{t("onboarding.history.how.title")}</h1>
        </div>
        <WhatYouGet />
        {source !== undefined && <ExportHowTo source={source} />}
        {matching ? (
          <p className="history-lede" role="status">
            {t("import.match.matching")}
          </p>
        ) : (
          <DropZone onFile={(file) => void choose(file)} links={source === undefined} />
        )}
      </WizardFrame>
    );

  const held = heldBack(review);
  const importing = review.plan.sessions.filter((_, i) => !held.includes(i));
  const usable = review.plan.sessions.length > 0;

  const confirm = async (): Promise<void> => {
    setReview({ ...review, busy: true, error: null });
    try {
      await importAll(api, importing, review.plan.format);
      wizard.next();
    } catch (error: unknown) {
      const message = errorMessage(error);
      setReview({ ...review, busy: false, error: message });
    }
  };

  return (
    <WizardFrame
      wizard={wizard}
      footer={
        usable ? (
          <Button
            variant="azure"
            disabled={review.busy || importing.length === 0}
            onClick={() => void confirm()}
          >
            {review.busy ? t("import.importing") : t("import.confirm", { count: importing.length })}
          </Button>
        ) : (
          byHand
        )
      }
    >
      <div className="history-head">
        {usable ? (
          <h1 className="wizard-title">
            {t("onboarding.history.review.title", { count: yearsIn(review.plan) })}
          </h1>
        ) : (
          <>
            <span className="history-kicker history-kicker--amber">
              {t("import.notRecognized")}
            </span>
            <h1 className="wizard-title">{t("import.nothingToImport")}</h1>
          </>
        )}
      </div>
      {usable && (
        <HistoryCard
          vm={historyCard(importedInsights(importing), [], scales)}
          label={t("onboarding.history.card.inThisFile")}
          slim
        />
      )}
      <ImportReview
        fileName={review.fileName}
        plan={review.plan}
        added={review.plan.sessions.map(() => [])}
        duplicates={review.duplicates}
        importAnyway={review.importAnyway}
        onImportAnyway={(index) =>
          setReview({
            ...review,
            importAnyway: review.importAnyway.includes(index)
              ? review.importAnyway.filter((i) => i !== index)
              : [...review.importAnyway, index],
          })
        }
        importing={importing.length}
        busy={review.busy}
        error={review.error}
      />
    </WizardFrame>
  );
};
