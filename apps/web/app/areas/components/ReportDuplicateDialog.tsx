import React from "react";
import { ApiError, type SendtallyApi } from "@sendtally/api-client";
import { areaClimbGradeLabel, type AreaClimb } from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { inputStyle } from "../styles";
import { AreaDialog } from "./AreaDialog";
import { Field } from "./Field";

export type ReportDuplicateDialogProps = {
  api: SendtallyApi;
  climb: AreaClimb;
  onClose: () => void;
  onReported: () => void;
};

const SEARCH_DELAY_MS = 250;

/** Search for the climb this one duplicates; a moderator merges this one into it. */
export function ReportDuplicateDialog({
  api,
  climb,
  onClose,
  onReported,
}: ReportDuplicateDialogProps): React.ReactElement {
  const [query, setQuery] = React.useState("");
  const [found, setFound] = React.useState<{ q: string; climbs: AreaClimb[] }>({
    q: "",
    climbs: [],
  });
  const [keep, setKeep] = React.useState<AreaClimb | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = query.trim();
    if (q === "") return;
    let live = true;
    const timer = setTimeout(() => {
      api
        .searchAreaClimbs(q)
        .then(({ climbs }) => {
          if (live) setFound({ q, climbs: climbs.filter((c) => c.id !== climb.id) });
        })
        .catch(() => {
          if (live) setFound({ q, climbs: [] });
        });
    }, SEARCH_DELAY_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [api, query, climb.id]);

  const q = query.trim();
  const results = found.q === q ? found.climbs : [];

  async function submit(): Promise<void> {
    if (keep === null) return setError(t("areas.pickTheOriginal"));
    setBusy(true);
    setError(null);
    try {
      await api.reportDuplicateClimb(climb.id, keep.id);
      onReported();
    } catch (e: unknown) {
      setBusy(false);
      setError(
        e instanceof ApiError && e.status === 409
          ? t("areas.alreadyReported")
          : t("common.somethingWentWrongTryAgain")
      );
    }
  }

  return (
    <AreaDialog
      label={t("areas.reportDuplicate")}
      title={t("areas.duplicateOf", { name: climb.name })}
      submitLabel={t("areas.sendReport")}
      busy={busy}
      error={error}
      onClose={onClose}
      onSubmit={() => void submit()}
    >
      {keep === null ? (
        <Field id="duplicate-search" label={t("areas.theOriginal")}>
          <input
            id="duplicate-search"
            value={query}
            autoFocus
            autoComplete="off"
            placeholder={t("areas.searchClimbs")}
            onChange={(e) => setQuery(e.target.value)}
            style={inputStyle}
          />
          {results.length > 0 && (
            <div className="project-dialog-suggestions" role="listbox">
              {results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="project-dialog-suggestion"
                  onClick={() => setKeep(c)}
                >
                  <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 15 }}>
                    {c.name}
                  </span>
                  <span className="project-meta">{areaClimbGradeLabel(c)}</span>
                </button>
              ))}
            </div>
          )}
          {q !== "" && found.q === q && results.length === 0 && (
            <span className="project-dialog-hint">{t("areas.noClimbsFound")}</span>
          )}
        </Field>
      ) : (
        <Field label={t("areas.theOriginal")}>
          <div className="project-dialog-identity">
            <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 15 }}>{keep.name}</span>
            <span className="project-meta">{areaClimbGradeLabel(keep)}</span>
            <button type="button" className="project-dialog-change" onClick={() => setKeep(null)}>
              {t("areas.change")}
            </button>
          </div>
          <span className="area-candidates-hint">
            {t("areas.duplicateExplainer", { duplicate: climb.name, original: keep.name })}
          </span>
        </Field>
      )}
    </AreaDialog>
  );
}
