import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { ClimbSummary, SendtallyApi } from "@sendtally/api-client";
import { effortColor } from "@sendtally/design/tokens";
import { climbFormFromDraft, withAreaClimb, type AreaClimb } from "@sendtally/features/areas";
import { useClimbVocabulary } from "@sendtally/features/climbs";
import { useGyms, type Gym } from "@sendtally/features/gyms";
import {
  adoptSavedDetails,
  draftProblem,
  draftSummary,
  disciplineOf,
  emptySessionDraft,
  storedDraft,
  circuitGyms,
  isFormProject,
  nextFormClimb,
  readClimbKind,
  toLogSessionInput,
  useDraftAutosave,
  withClimb,
  withClimbArea,
  withClimbScale,
  withGym,
  withLocation,
  withProjectToggled,
  withSuggestedClimb,
  withTypedClimbName,
  type ClimbArea,
  type ClimbDraft,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { SESSION_NOTE_MAX } from "@sendtally/features/sessions";
import { queries } from "@sendtally/features/query";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { formatDate, t } from "@sendtally/features/i18n";
import { DiscardDraftDialog } from "../../components/DiscardDraftDialog";
import { useIsNarrow } from "../../lib/useIsNarrow";
import { climbKindStorage, liveSessionStorage, sessionDraftStorage } from "../../lib/localStorages";
import { AreaFormDialog } from "../../areas/components/AreaFormDialog";
import { ClimbFormDialog } from "../../areas/components/ClimbFormDialog";
import { useDeviceLocation } from "../../areas/useDeviceLocation";
import type { ClimbAreas } from "./AreaClimbNameField";
import { DraftBanner } from "./DraftBanner";
import { ClimbCard } from "./ClimbCard";
import { Icon } from "../../components/Icon";
import { NewGymDialog } from "../../gyms/components/NewGymDialog";
import { ClimbEditorSheet } from "./ClimbEditorSheet";
import { ClimbLedgerRow } from "./ClimbLedgerRow";
import { Glyph } from "./Glyph";
import { CHECK, PLUS, chipStyle, columnHead, inputStyle, monoLabel } from "./styles";

function hhmm(at: Date): string {
  return formatDate(at, { hour: "2-digit", minute: "2-digit" });
}

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <span style={monoLabel}>{label}</span>
      {children}
    </div>
  );
}

function RpePicker({
  rpe,
  onChange,
}: {
  rpe: number | null;
  onChange: (rpe: number | null) => void;
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={monoLabel}>{t("common.effort")}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fontSize: 17,
              color: "var(--bs-gunmetal)",
            }}
          >
            {rpe === null ? (
              <span style={{ fontSize: 12, color: "rgba(64,63,76,0.55)" }}>
                {t("logSession.auto")}
              </span>
            ) : (
              <>
                {rpe}
                <span style={{ fontSize: 12, opacity: 0.6 }}>/10</span>
              </>
            )}
          </span>
        </div>
        {rpe !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              ...monoLabel,
              fontSize: 10,
              color: "var(--bs-azure-ink)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {t("logSession.resetToAuto")}
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: 10 }, (_, i) => {
          const value = i + 1;
          const lit = rpe !== null && value <= rpe;
          return (
            <button
              key={value}
              type="button"
              aria-label={t("common.effortValue", { n: value })}
              onClick={() => onChange(value)}
              className="log-session-rpe"
              style={{
                flex: 1,
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                background: lit ? effortColor(rpe ?? 1) : "var(--data-bar-empty)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function LogSessionForm({
  api,
  editing,
  header,
}: {
  api: SendtallyApi;
  editing?: { fingerprint: string; draft: LogSessionDraft };
  /** Given by the edit page: its heading, with the live climb summary under the title. */
  header?: (summary: string) => React.ReactNode;
}): React.ReactElement {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [searchParams] = useSearchParams();
  const prefs = useGradeScalePrefs(api);
  // Opened by tapping the draft itself: start on it rather than offering it back.
  const [picked] = React.useState(() =>
    searchParams.get("resume") === "1" ? storedDraft(sessionDraftStorage) : null
  );
  const [draft, setDraft] = React.useState<LogSessionDraft>(
    () => editing?.draft ?? picked ?? emptySessionDraft(new Date(), prefs.scales)
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);

  const vocabulary = useClimbVocabulary(api);
  const gyms = useGyms(api);
  const circuitChoices = draft.location === "indoor" ? circuitGyms(gyms.gyms) : [];
  const narrow = useIsNarrow();
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [addingGym, setAddingGym] = React.useState(false);
  const [adding, setAdding] = React.useState<
    { kind: "crag"; key: string; name: string } | { kind: "climb"; key: string } | null
  >(null);
  const [near, locate] = useDeviceLocation();
  const outdoor = draft.location === "outdoor";

  // The preference query resolves after the first render, so a new draft adopts the user's
  // scale once, per discipline and only where no grade has been typed yet. A draft picked
  // back up, and anything already graded, keeps the scale it was written in.
  const adopted = React.useRef(editing !== undefined || picked !== null);
  const resumeDraft = React.useCallback((resumed: LogSessionDraft) => {
    adopted.current = true;
    setDraft(resumed);
  }, []);
  const autosave = useDraftAutosave(
    editing === undefined ? sessionDraftStorage : null,
    draft,
    resumeDraft,
    picked !== null
  );

  React.useEffect(() => {
    if (adopted.current || !prefs.ready) return;
    adopted.current = true;
    const next = {
      ...draft,
      climbs: draft.climbs.map((c) =>
        c.grade === "" ? withClimbScale(c, prefs.scales[disciplineOf(c.scale)]) : c
      ),
    };
    autosave.rebase(next);
    setDraft(next);
  }, [prefs.ready, prefs.scales, draft, autosave]);
  const editingIndex = draft.climbs.findIndex((c) => c.key === editingKey);
  const editingClimb = editingIndex < 0 ? null : draft.climbs[editingIndex]!;
  const cancelTo =
    editing === undefined ? "/app" : `/app/sessions/${encodeURIComponent(editing.fingerprint)}`;

  const problem = draftProblem(draft);

  /** Cancel walks away from the draft, so it only leaves one behind after a confirmation. */
  function cancel(): void {
    if (autosave.savedAt === null) void navigate(cancelTo);
    else setConfirmingCancel(true);
  }

  function setGym(next: Gym | null): void {
    setDraft((d) => withGym(d, next));
  }

  function updateClimb(key: string, climb: ClimbDraft): void {
    setDraft((d) => withClimb(d, key, () => climb));
  }

  function updateClimbName(key: string, name: string): void {
    setDraft((d) => withClimb(d, key, (c) => withTypedClimbName(c, name, vocabulary.climbs)));
  }

  function pickClimb(key: string, known: ClimbSummary): void {
    setDraft((d) =>
      withClimb(d, key, (c) => withSuggestedClimb(c, known, d.location === "outdoor"))
    );
  }

  function setClimbArea(key: string, area: ClimbArea | null): void {
    setDraft((d) => withClimb(d, key, (c) => withClimbArea(c, area)));
  }

  function pickAreaClimb(key: string, picked: AreaClimb): void {
    setDraft((d) => withClimb(d, key, (c) => withAreaClimb(c, picked)));
  }

  function climbAreas(climb: ClimbDraft): ClimbAreas {
    return {
      api,
      pickable: outdoor || climb.name.trim() !== "",
      area: climb.area ?? null,
      near,
      onArea: (area) => setClimbArea(climb.key, area),
      onAddArea: (name) => {
        setEditingKey(null);
        setAdding({ kind: "crag", key: climb.key, name });
      },
      onLocate: locate,
      onPickArea: (picked) => pickAreaClimb(climb.key, picked),
      // The sheet is a modal in the top layer, so it steps aside for the add dialog.
      onAdd: () => {
        setEditingKey(null);
        setAdding({ kind: "climb", key: climb.key });
      },
    };
  }

  const addingClimb =
    adding?.kind === "climb" ? draft.climbs.find((c) => c.key === adding.key) : undefined;

  function removeClimb(key: string): void {
    setDraft((d) => ({ ...d, climbs: d.climbs.filter((c) => c.key !== key) }));
    setEditingKey(null);
  }

  function addClimb(): void {
    const kind = readClimbKind(climbKindStorage, circuitChoices);
    const climb = nextFormClimb(draft, kind, prefs.scales, circuitChoices);
    setDraft({ ...draft, climbs: [...draft.climbs, climb] });
    if (narrow) setEditingKey(climb.key);
  }

  const isProject = (climb: ClimbDraft): boolean => isFormProject(climb, vocabulary.isProject);

  function toggleProject(climb: ClimbDraft): void {
    updateClimb(climb.key, withProjectToggled(climb, vocabulary.isProject));
  }

  async function save(): Promise<void> {
    if (problem !== null) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input = toLogSessionInput(draft);
      const { session } =
        editing === undefined
          ? await api.logSession(input)
          : await api.updateLoggedSession(editing.fingerprint, input);
      // The response is written before a Strava post starts, so it opens the
      // page at once but is stored stale for the page to re-read on mount.
      client.setQueryData(queries.session(api, session.fingerprint).queryKey, session, {
        updatedAt: 0,
      });
      autosave.clear();
      if (editing !== undefined) {
        adoptSavedDetails(liveSessionStorage, editing.fingerprint, draft, new Date());
      }
      await navigate(`/app/sessions/${encodeURIComponent(session.fingerprint)}`);
    } catch {
      setError(t("logSession.saveFailed"));
      setSaving(false);
    }
  }

  return (
    <div className="log-session">
      {header?.(draftSummary(draft))}
      {autosave.offered !== null && (
        <DraftBanner
          stored={autosave.offered}
          onResume={autosave.resume}
          onStartFresh={autosave.startFresh}
        />
      )}
      <div className="log-session-grid">
        <div className="log-session-details">
          <Field
            label={
              <>
                {t("logSession.sessionName")}{" "}
                <span style={{ color: "rgba(64,63,76,0.45)" }}>{t("common.optional")}</span>
              </>
            }
          >
            <input
              value={draft.name}
              placeholder={t("logSession.sessionNamePlaceholder")}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="log-session-control"
              style={inputStyle}
            />
          </Field>
          <Field label={t("logSession.date")}>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className="log-session-control"
              style={inputStyle}
            />
          </Field>
          <Field label={t("logSession.location")}>
            <div style={{ display: "flex", gap: 8 }}>
              {(["indoor", "outdoor"] as const).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setDraft(withLocation(draft, loc))}
                  className="log-session-chip"
                  style={chipStyle(draft.location === loc)}
                >
                  {t(loc === "indoor" ? "common.indoor" : "common.outdoor")}
                </button>
              ))}
            </div>
          </Field>
          {draft.location === "indoor" && gyms.ready && gyms.gyms.length > 0 && (
            <Field label={t("gyms.gym")}>
              <select
                value={draft.gymId ?? ""}
                onChange={(e) => setGym(gyms.gyms.find((g) => g.id === e.target.value) ?? null)}
                className="log-session-control"
                style={inputStyle}
              >
                <option value="">{t("gyms.noGym")}</option>
                {gyms.gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {draft.location === "indoor" && gyms.ready && gyms.gyms.length === 0 && (
            <Field label={t("gyms.gym")}>
              <button
                type="button"
                onClick={() => setAddingGym(true)}
                className="log-session-chip"
                style={{
                  ...chipStyle(false),
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="plus" size={14} strokeWidth={2.2} />
                {t("gyms.addGym")}
              </button>
            </Field>
          )}
          <RpePicker rpe={draft.rpe} onChange={(rpe) => setDraft({ ...draft, rpe })} />
          <Field
            label={
              <>
                {t("common.notes")}{" "}
                <span style={{ color: "rgba(64,63,76,0.45)" }}>{t("common.optional")}</span>
              </>
            }
          >
            <textarea
              value={draft.notes}
              rows={4}
              maxLength={SESSION_NOTE_MAX}
              placeholder={t("common.notesPlaceholder")}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              className="log-session-control"
              style={{ ...inputStyle, lineHeight: 1.55, resize: "vertical" }}
            />
          </Field>
          <div
            style={{
              background: "var(--surface-soft)",
              borderRadius: "var(--radius-card)",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <span style={columnHead}>{t("logSession.afterYouSave")}</span>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(64,63,76,0.88)" }}>
              {editing === undefined ? t("logSession.afterSaveNew") : t("logSession.afterSaveEdit")}
            </p>
          </div>
        </div>

        <div className="log-session-climbs">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <span style={{ ...monoLabel, color: "var(--text-label-accent)" }}>
              {t("logSession.climbsCount", { n: draft.climbs.length })}
            </span>
            <span style={columnHead}>{t("logSession.scalesInSettings")}</span>
          </div>
          <div className={narrow ? "climb-ledger" : "climb-cards"}>
            {draft.climbs.map((climb) =>
              narrow ? (
                <ClimbLedgerRow
                  key={climb.key}
                  climb={climb}
                  project={isProject(climb)}
                  onPress={() => setEditingKey(climb.key)}
                />
              ) : (
                <ClimbCard
                  key={climb.key}
                  climb={climb}
                  gyms={circuitChoices}
                  prefs={prefs.scales}
                  removable={draft.climbs.length > 1}
                  project={isProject(climb)}
                  suggestions={vocabulary.suggestionsFor(climb.name)}
                  onChange={(c) => updateClimb(climb.key, c)}
                  onChangeName={(name) => updateClimbName(climb.key, name)}
                  onPick={(known) => pickClimb(climb.key, known)}
                  areas={climbAreas(climb)}
                  onToggleProject={() => toggleProject(climb)}
                  onRemove={() => removeClimb(climb.key)}
                />
              )
            )}
            <button
              type="button"
              onClick={addClimb}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                border: "1px dashed rgba(64,63,76,0.25)",
                borderRadius: "var(--radius-card)",
                padding: 15,
                background: "none",
                cursor: "pointer",
                ...monoLabel,
                color: "var(--bs-azure-ink)",
              }}
            >
              <Glyph d={PLUS} />
              {t("logSession.addClimb")}
            </button>
            {narrow && (
              <span style={{ ...columnHead, textAlign: "center" }}>
                {t("logSession.tapToEdit")}
              </span>
            )}
          </div>
        </div>
      </div>

      {confirmingCancel && autosave.savedAt !== null && (
        <DiscardDraftDialog
          stored={{ draft, savedAt: autosave.savedAt }}
          onCancel={() => setConfirmingCancel(false)}
          onDiscard={() => {
            autosave.clear();
            void navigate(cancelTo);
          }}
        />
      )}

      {addingGym && (
        <NewGymDialog gyms={gyms} onClose={() => setAddingGym(false)} onCreated={setGym} />
      )}

      {narrow && editingClimb !== null && (
        <ClimbEditorSheet
          climb={editingClimb}
          index={editingIndex}
          count={draft.climbs.length}
          gyms={circuitChoices}
          prefs={prefs.scales}
          project={isProject(editingClimb)}
          suggestions={vocabulary.suggestionsFor(editingClimb.name)}
          onChange={(c) => updateClimb(editingClimb.key, c)}
          onChangeName={(name) => updateClimbName(editingClimb.key, name)}
          onPick={(known) => pickClimb(editingClimb.key, known)}
          areas={climbAreas(editingClimb)}
          onToggleProject={() => toggleProject(editingClimb)}
          onRemove={() => removeClimb(editingClimb.key)}
          onClose={() => setEditingKey(null)}
        />
      )}

      {adding?.kind === "crag" && (
        <AreaFormDialog
          mode="create"
          api={api}
          parent={null}
          initial={{
            name: adding.name,
            ...(near === null ? {} : { lat: String(near.lat), lon: String(near.lon) }),
          }}
          onCreated={(area) => {
            setClimbArea(adding.key, { id: area.id, name: area.name });
            setAdding(null);
          }}
          onClose={() => setAdding(null)}
          onSuggested={() => setAdding(null)}
        />
      )}

      {addingClimb !== undefined && (
        <ClimbFormDialog
          mode="create"
          api={api}
          area={addingClimb.area ?? null}
          initial={climbFormFromDraft(addingClimb, prefs.scales)}
          onCreated={(created, area) => {
            setDraft((d) =>
              withClimb(d, addingClimb.key, (c) => ({
                ...withAreaClimb(c, created),
                area: c.area ?? { id: area.id, name: area.name },
              }))
            );
            setAdding(null);
          }}
          onClose={() => setAdding(null)}
          onSuggested={() => setAdding(null)}
        />
      )}

      <div className="log-session-actions">
        <div className="log-session-buttons">
          <button
            type="button"
            onClick={cancel}
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: 15,
              padding: "14px 22px",
              borderRadius: "var(--radius-control)",
              color: "rgba(64,63,76,0.65)",
              border: "1px solid rgba(64,63,76,0.18)",
              background: "none",
              cursor: "pointer",
            }}
          >
            {t("common.discard")}
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: 15,
              padding: "14px 22px",
              borderRadius: "var(--radius-control)",
              background: "var(--bs-azure-ink)",
              color: "var(--bs-white)",
              border: "none",
              cursor: "pointer",
              opacity: saving ? 0.45 : 1,
            }}
          >
            {saving
              ? t("common.saving")
              : editing === undefined
                ? t("common.done")
                : t("logSession.saveChanges")}
          </button>
        </div>
        <div className="log-session-status">
          {autosave.savedAt !== null && (
            <span
              style={{
                ...monoLabel,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                color: "rgba(64,63,76,0.55)",
              }}
            >
              <Glyph d={CHECK} />
              {t("logSession.draftSaved", { time: hhmm(autosave.savedAt) })}
            </span>
          )}
          {error !== null && (
            <span
              style={{ ...monoLabel, textTransform: "none", color: "var(--text-label-accent)" }}
            >
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
