import React from "react";
import { Link } from "react-router";
import type { SendtallyApi } from "@sendtally/api-client";
import { planImport, type ImportPlan, type ImportSession } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { BackLink, backLinkStyle } from "../../components/BackLink";
import { Section } from "../../settings/components/Section";
import { bodyText, pageTitle, secondaryButton } from "../../settings/components/styles";
import { goldButton } from "../styles";
import { DropZone } from "./DropZone";
import { FormatGuide } from "./FormatGuide";
import { ImportReview } from "./ImportReview";
import { Stat } from "./Stat";
import { Steps } from "./Steps";

const BATCH = 200;

type State =
  | { step: "choose" }
  | { step: "review"; fileName: string; plan: ImportPlan; busy: boolean; error: string | null }
  | { step: "done"; imported: number; skipped: number; skippedRows: number };

// Batches go up in date order so each one is scored after the ones before it.
async function importAll(
  api: SendtallyApi,
  sessions: ImportSession[]
): Promise<{ imported: number; skipped: number }> {
  const totals = { imported: 0, skipped: 0 };
  for (let i = 0; i < sessions.length; i += BATCH) {
    const result = await api.importSessions({
      sessions: sessions.slice(i, i + BATCH).map(({ rows: _rows, ...s }) => s),
    });
    totals.imported += result.imported;
    totals.skipped += result.skipped;
  }
  return totals;
}

export function ImportFlow({ api }: { api: SendtallyApi }): React.ReactElement {
  const [state, setState] = React.useState<State>({ step: "choose" });

  const choose = async (file: File): Promise<void> => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const plan = planImport(await file.text(), timeZone);
    setState({ step: "review", fileName: file.name, plan, busy: false, error: null });
  };

  const confirm = async (): Promise<void> => {
    if (state.step !== "review") return;
    setState({ ...state, busy: true, error: null });
    try {
      const totals = await importAll(api, state.plan.sessions);
      setState({ step: "done", ...totals, skippedRows: state.plan.issues.length });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setState({ ...state, busy: false, error: message });
    }
  };

  const title =
    state.step === "choose"
      ? t("import.title")
      : state.step === "review"
        ? t("import.reviewTitle")
        : t("import.doneTitle");

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 14 }}>
      {state.step === "choose" && <BackLink to="/app/settings">{t("common.settings")}</BackLink>}
      {state.step === "review" && (
        <button
          type="button"
          onClick={() => setState({ step: "choose" })}
          style={{
            ...backLinkStyle,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          ← {t("import.chooseAnother")}
        </button>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 style={{ ...pageTitle, fontSize: 36 }}>{title}</h1>
        <Steps current={state.step} />
      </div>

      {state.step === "choose" && (
        <>
          <DropZone onFile={(file) => void choose(file)} />
          <FormatGuide />
        </>
      )}

      {state.step === "review" && (
        <ImportReview
          fileName={state.fileName}
          plan={state.plan}
          busy={state.busy}
          error={state.error}
          onConfirm={() => void confirm()}
          onCancel={() => setState({ step: "choose" })}
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
            <p style={bodyText}>{t("import.doneBody")}</p>
          </Section>
          <div style={{ display: "flex", gap: 12 }}>
            <Link to="/app" style={goldButton}>
              {t("import.openLog")}
            </Link>
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
