import React from "react";
import { useNavigate } from "react-router";
import type { SendtallyApi } from "@sendtally/api-client";
import { Button } from "@sendtally/design";
import {
  likelyDuplicates,
  planImport,
  type ImportPlan,
  type LikelyDuplicate,
} from "@sendtally/core/import";
import {
  columnsMatchedEvent,
  importAll,
  matchedCsv,
  requestColumns,
  sheetMeta,
  withAddedTags,
  withTag,
  type ColumnsReview,
} from "@sendtally/features/import";
import { sameTagName, useTagVocabulary } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { BackLink } from "../../components/BackLink";
import { capture } from "../../lib/analytics";
import { Section } from "../../settings/components/Section";
import { bodyText, monoMuted, pageTitle, secondaryButton } from "../../settings/components/styles";
import { sha256Hex } from "../sha256Hex";
import { ColumnMatch } from "./ColumnMatch";
import { DropZone } from "./DropZone";
import { FormatGuide } from "./FormatGuide";
import { ImportReview } from "./ImportReview";
import { Stat } from "./Stat";
import { Steps } from "./Steps";
import { errorMessage } from "@sendtally/features/query";

type State =
  | { step: "choose"; matching?: boolean }
  | { step: "columns"; columns: ColumnsReview }
  | {
      step: "review";
      fileName: string;
      plan: ImportPlan;
      added: string[][];
      duplicates: LikelyDuplicate[];
      importAnyway: number[];
      busy: boolean;
      error: string | null;
    }
  | { step: "done"; imported: number; skipped: number; likely: number; skippedRows: number };

const heldBack = (state: { duplicates: LikelyDuplicate[]; importAnyway: number[] }): number[] =>
  state.duplicates.map((d) => d.index).filter((i) => !state.importAnyway.includes(i));

export function ImportFlow({ api }: { api: SendtallyApi }): React.ReactElement {
  const [state, setState] = React.useState<State>({ step: "choose" });
  const navigate = useNavigate();
  const { suggestionsFor } = useTagVocabulary(api);

  const retag = (indexes: number[], change: (tags: string[]) => string[]): void =>
    setState((s) =>
      s.step === "review"
        ? { ...s, added: s.added.map((tags, i) => (indexes.includes(i) ? change(tags) : tags)) }
        : s
    );

  const read = async (fileName: string, text: string): Promise<void> => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const plan = planImport(text, timeZone);
    const log = await api.sessionsWithClimbs();
    const duplicates = await likelyDuplicates(plan.sessions, log.sessions, sha256Hex);
    setState({
      step: "review",
      fileName,
      plan,
      added: plan.sessions.map(() => []),
      duplicates,
      importAnyway: [],
      busy: false,
      error: null,
    });
  };

  const choose = async (file: File): Promise<void> => {
    const text = await file.text();
    const plan = planImport(text, "UTC");
    if (plan.sessions.length > 0 || plan.issues[0]?.code !== "noHeader")
      return read(file.name, text);
    setState({ step: "choose", matching: true });
    const columns = await requestColumns(api, text, file.name);
    if (columns === null) return read(file.name, text);
    setState({ step: "columns", columns });
  };

  const confirm = async (): Promise<void> => {
    if (state.step !== "review") return;
    setState({ ...state, busy: true, error: null });
    try {
      const held = heldBack(state);
      const sessions = withAddedTags(state.plan.sessions, state.added).filter(
        (_, i) => !held.includes(i)
      );
      const totals = await importAll(api, sessions, state.plan.format);
      setState({
        step: "done",
        ...totals,
        likely: held.length,
        skippedRows: state.plan.issues.length,
      });
    } catch (error: unknown) {
      const message = errorMessage(error);
      setState({ ...state, busy: false, error: message });
    }
  };

  const title =
    state.step === "choose"
      ? t("import.title")
      : state.step === "columns"
        ? t("import.match.title")
        : state.step === "review"
          ? t("import.reviewTitle")
          : t("import.doneTitle");

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 14 }}>
      {state.step === "choose" && <BackLink to="/app/settings">{t("common.settings")}</BackLink>}
      {state.step === "review" && (
        <BackLink onClick={() => setState({ step: "choose" })}>
          {t("import.chooseAnother")}
        </BackLink>
      )}
      {state.step === "columns" && (
        <BackLink
          onClick={() => {
            capture("import_columns_matched", columnsMatchedEvent(state.columns, "fallback"));
            setState({ step: "choose" });
          }}
        >
          {t("import.chooseAnother")}
        </BackLink>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 style={{ ...pageTitle, fontSize: 36 }}>{title}</h1>
        {state.step === "columns" ? (
          <span style={monoMuted}>{sheetMeta(state.columns)}</span>
        ) : (
          <Steps current={state.step} />
        )}
      </div>

      {state.step === "choose" && (
        <>
          {state.matching === true ? (
            <p style={bodyText} role="status">
              {t("import.match.matching")}
            </p>
          ) : (
            <DropZone onFile={(file) => void choose(file)} />
          )}
          <FormatGuide />
        </>
      )}

      {state.step === "columns" && (
        <>
          <ColumnMatch
            review={state.columns}
            onChange={(columns) => setState({ step: "columns", columns })}
          />
          <div>
            <Button
              variant="azure"
              onClick={() => {
                capture("import_columns_matched", columnsMatchedEvent(state.columns, "matched"));
                void read(state.columns.fileName, matchedCsv(state.columns));
              }}
            >
              {t("import.match.confirm")}
            </Button>
          </div>
        </>
      )}

      {state.step === "review" && (
        <ImportReview
          fileName={state.fileName}
          plan={state.plan}
          added={state.added}
          tagging={{
            suggestionsFor,
            onAddTag: (indexes, tag) => retag(indexes, (tags) => withTag(tags, tag)),
            onRemoveTag: (indexes, tag) =>
              retag(indexes, (tags) => tags.filter((t) => !sameTagName(t, tag))),
          }}
          duplicates={state.duplicates}
          importAnyway={state.importAnyway}
          onImportAnyway={(index) =>
            setState((s) =>
              s.step === "review"
                ? {
                    ...s,
                    importAnyway: s.importAnyway.includes(index)
                      ? s.importAnyway.filter((i) => i !== index)
                      : [...s.importAnyway, index],
                  }
                : s
            )
          }
          importing={state.plan.sessions.length - heldBack(state).length}
          busy={state.busy}
          error={state.error}
          actions={{
            onConfirm: () => void confirm(),
            onCancel: () => setState({ step: "choose" }),
          }}
        />
      )}

      {state.step === "done" && (
        <>
          <Section>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}
            >
              <Stat value={state.imported} label={t("import.statAdded")} />
              <Stat value={state.skipped} label={t("import.statAlreadyThere")} />
              <Stat value={state.skippedRows} label={t("import.statSkipped")} />
            </div>
            {state.likely > 0 && (
              <p style={bodyText}>{t("import.likelySkipped", { count: state.likely })}</p>
            )}
            <p style={bodyText}>{t("import.doneBody")}</p>
          </Section>
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="azure" onClick={() => void navigate("/app")}>
              {t("import.openLog")}
            </Button>
            <button
              type="button"
              style={secondaryButton}
              onClick={() => setState({ step: "choose" })}
            >
              {t("import.importAnother")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
