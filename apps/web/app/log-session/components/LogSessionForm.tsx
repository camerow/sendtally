import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { ClimbSummary, SendtallyApi } from "@sendtally/api-client";
import { effortColor } from "@sendtally/design/tokens";
import {
  climbFormFromDraft,
  withAreaClimb,
  withTypedName,
  type AreaClimb,
} from "@sendtally/features/areas";
import { climbDraftGrade, findClimb, useClimbVocabulary } from "@sendtally/features/climbs";
import {
  circuitGym,
  useGyms,
  withCircuit,
  withoutCircuit,
  type Gym,
} from "@sendtally/features/gyms";
import {
  draftProblem,
  draftSummary,
  disciplineOf,
  emptyDraft,
  storedDraft,
  newClimbOfKind,
  circuitGyms,
  nextClimbKey,
  readClimbKind,
  toLogSessionInput,
  useDraftAutosave,
  withClimbScale,
  withStartTime,
  withTag,
  withoutTag,
  type ClimbDraft,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { SESSION_NOTE_MAX, useTagVocabulary } from "@sendtally/features/sessions";
import { queries } from "@sendtally/features/query";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { formatDate, t } from "@sendtally/features/i18n";
import { DiscardDraftDialog } from "../../components/DiscardDraftDialog";
import { TagPicker } from "../../components/TagPicker";
import { useIsNarrow } from "../../lib/useIsNarrow";
import { climbKindStorage } from "../../lib/climbKindStorage";
import { sessionDraftStorage } from "../../lib/sessionDraftStorage";
import { AreaFormDialog } from "../../areas/components/AreaFormDialog";
import { AreaPicker } from "../../areas/components/AreaPicker";
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
}: {
  api: SendtallyApi;
  editing?: { fingerprint: string; draft: LogSessionDraft };
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
    () => editing?.draft ?? picked ?? emptyDraft(new Date(), prefs.scales)
  );
  const [addingTimes, setAddingTimes] = React.useState(false);
  const timesOpen = addingTimes || draft.startTime !== "" || draft.endTime !== "";
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);
  const { suggestionsFor } = useTagVocabulary(api);

  const vocabulary = useClimbVocabulary(api);
  const gyms = useGyms(api);
  const circuitChoices = draft.location === "indoor" ? circuitGyms(gyms.gyms) : [];
  const narrow = useIsNarrow();
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [addingGym, setAddingGym] = React.useState(false);
  const [adding, setAdding] = React.useState<
    { kind: "crag"; name: string } | { kind: "climb"; key: string } | null
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

  /** Changing the gym re-places every climb: onto the new gym's first circuit, or off circuits. */
  function setGym(next: Gym | null): void {
    const at = circuitGym(next);
    const first = at?.circuits[0];
    setDraft((d) => ({
      ...d,
      gymId: next?.id,
      climbs: d.climbs.map((c) =>
        at === null || first === undefined
          ? withoutCircuit(c)
          : withCircuit(c, at.circuits.find((x) => x.id === c.circuit?.id) ?? first, at)
      ),
    }));
  }

  function updateClimb(key: string, climb: ClimbDraft): void {
    setDraft((d) => ({ ...d, climbs: d.climbs.map((c) => (c.key === key ? climb : c)) }));
  }

  function updateClimbName(key: string, name: string): void {
    const known = findClimb(vocabulary.climbs, name);
    setDraft((d) => ({
      ...d,
      climbs: d.climbs.map((c) =>
        c.key !== key
          ? c
          : {
              ...withTypedName(c, name),
              project: undefined,
              // A project added from the projects page has no grade yet, so the
              // one the user already picked in the form stands.
              ...(known === undefined || climbDraftGrade(known, c.scale) === ""
                ? {}
                : { grade: climbDraftGrade(known, c.scale) }),
            }
      ),
    }));
  }

  function pickClimb(key: string, known: ClimbSummary): void {
    setDraft((d) => ({
      ...d,
      climbs: d.climbs.map((c) =>
        c.key !== key
          ? c
          : {
              ...withTypedName(c, known.name),
              project: undefined,
              ...(climbDraftGrade(known, c.scale) === ""
                ? {}
                : { grade: climbDraftGrade(known, c.scale) }),
            }
      ),
    }));
  }

  function pickAreaClimb(key: string, picked: AreaClimb): void {
    setDraft((d) => ({
      ...d,
      climbs: d.climbs.map((c) => (c.key === key ? withAreaClimb(c, picked) : c)),
    }));
  }

  function climbAreas(climb: ClimbDraft): ClimbAreas | undefined {
    if (!outdoor) return undefined;
    return {
      api,
      areaId: draft.area?.id ?? null,
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
    const key = nextClimbKey(draft.climbs);
    setDraft({
      ...draft,
      climbs: [
        ...draft.climbs,
        newClimbOfKind(
          key,
          readClimbKind(climbKindStorage, circuitChoices),
          prefs.scales,
          circuitChoices,
          draft.climbs[draft.climbs.length - 1]
        ),
      ],
    });
    if (narrow) setEditingKey(key);
  }

  function isProject(climb: ClimbDraft): boolean {
    return climb.project ?? vocabulary.isProject(climb.name);
  }

  function toggleProject(climb: ClimbDraft): void {
    updateClimb(climb.key, { ...climb, project: !isProject(climb) });
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
      await navigate(`/app/sessions/${encodeURIComponent(session.fingerprint)}`);
    } catch {
      setError(t("logSession.saveFailed"));
      setSaving(false);
    }
  }

  return (
    <div className="log-session">
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
                  onClick={() => setDraft({ ...draft, location: loc })}
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
          {outdoor && (
            <Field
              label={
                <>
                  {t("areas.crag")}{" "}
                  <span style={{ color: "rgba(64,63,76,0.45)" }}>{t("common.optional")}</span>
                </>
              }
            >
              <AreaPicker
                api={api}
                crags
                value={draft.area ?? null}
                near={near}
                placeholder={t("areas.searchCrags")}
                className="log-session-control"
                inputStyle={inputStyle}
                addLabel={(name) => t("areas.addThisCrag", { name })}
                onPick={(area) =>
                  setDraft((d) => ({
                    ...d,
                    area: area === null ? undefined : { id: area.id, name: area.name },
                  }))
                }
                onAdd={(name) => setAdding({ kind: "crag", name })}
                onFocus={locate}
              />
            </Field>
          )}
          <Field
            label={
              <>
                {t("common.tags")}{" "}
                <span style={{ color: "rgba(64,63,76,0.45)" }}>{t("common.optional")}</span>
              </>
            }
          >
            <TagPicker
              tags={draft.tags}
              suggestions={suggestionsFor(draft.tags)}
              placeholder={t("logSession.tagsPlaceholder")}
              onAdd={(name) => setDraft((d) => withTag(d, name))}
              onRemove={(name) => setDraft((d) => withoutTag(d, name))}
            />
          </Field>
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
            setDraft((d) => ({ ...d, area: { id: area.id, name: area.name } }));
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
          area={draft.area ?? null}
          initial={climbFormFromDraft(addingClimb, prefs.scales)}
          onCreated={(created, area) => {
            setDraft((d) => ({
              ...d,
              area: d.area ?? { id: area.id, name: area.name },
              climbs: d.climbs.map((c) =>
                c.key === addingClimb.key ? withAreaClimb(c, created) : c
              ),
            }));
            setAdding(null);
          }}
          onClose={() => setAdding(null)}
          onSuggested={() => setAdding(null)}
        />
      )}

      {timesOpen ? (
        <div className="log-session-times-block">
          <div className="log-session-times">
            <Field label={t("logSession.startTime")}>
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => setDraft((d) => withStartTime(d, e.target.value))}
                className="log-session-control"
                style={inputStyle}
              />
            </Field>
            <Field label={t("logSession.endTime")}>
              <input
                type="time"
                value={draft.endTime}
                onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
                className="log-session-control"
                style={inputStyle}
              />
            </Field>
          </div>
          <span style={{ ...monoLabel, textTransform: "none", letterSpacing: 0 }}>
            {t("logSession.timesHint")}
          </span>
        </div>
      ) : (
        <button
          type="button"
          className="log-session-add-times"
          onClick={() => setAddingTimes(true)}
        >
          {t("logSession.addTimes")}
        </button>
      )}

      <div className="log-session-actions">
        <div className="log-session-status">
          <span style={monoLabel}>{draftSummary(draft)}</span>
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
      </div>
    </div>
  );
}
