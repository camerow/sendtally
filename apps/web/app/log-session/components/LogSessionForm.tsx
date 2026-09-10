import React from "react";
import { useNavigate } from "react-router";
import type { ClimbSummary, SendtallyApi } from "@sendtally/api-client";
import { climbDraftGrade, findClimb, useClimbVocabulary } from "@sendtally/features/climbs";
import {
  GRADE_SCALE_OPTIONS,
  draftProblem,
  draftSummary,
  emptyDraft,
  newClimb,
  toLogSessionInput,
  withScale,
  withTag,
  withoutTag,
  type ClimbDraft,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { SESSION_NOTE_MAX, useTagVocabulary } from "@sendtally/features/sessions";
import { TagPicker } from "../../components/TagPicker";
import { useIsNarrow } from "../../lib/useIsNarrow";
import { ClimbCard } from "./ClimbCard";
import { ClimbEditorSheet } from "./ClimbEditorSheet";
import { ClimbLedgerRow } from "./ClimbLedgerRow";
import { Glyph } from "./Glyph";
import { PLUS, chipStyle, columnHead, inputStyle, monoLabel } from "./styles";

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
          <span style={monoLabel}>RPE</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fontSize: 17,
              color: "var(--bs-gunmetal)",
            }}
          >
            {rpe === null ? (
              <span style={{ fontSize: 12, color: "rgba(64,63,76,0.55)" }}>AUTO</span>
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
            RESET TO AUTO
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
              aria-label={`RPE ${value}`}
              onClick={() => onChange(value)}
              className="log-session-rpe"
              style={{
                flex: 1,
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                background: lit ? "var(--data-bar)" : "var(--data-bar-empty)",
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
  const [draft, setDraft] = React.useState<LogSessionDraft>(
    () => editing?.draft ?? emptyDraft(new Date())
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const nextKey = React.useRef(draft.climbs.length + 1);
  const { suggestionsFor } = useTagVocabulary(api);
  const vocabulary = useClimbVocabulary(api);
  const narrow = useIsNarrow();
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const editingIndex = draft.climbs.findIndex((c) => c.key === editingKey);
  const editingClimb = editingIndex < 0 ? null : draft.climbs[editingIndex]!;
  const cancelTo =
    editing === undefined ? "/app" : `/app/sessions/${encodeURIComponent(editing.fingerprint)}`;

  const problem = draftProblem(draft);

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
              ...c,
              name,
              project: undefined,
              ...(known === undefined ? {} : { grade: climbDraftGrade(known, d.scale) }),
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
          : { ...c, name: known.name, grade: climbDraftGrade(known, d.scale), project: undefined }
      ),
    }));
  }

  function removeClimb(key: string): void {
    setDraft((d) => ({ ...d, climbs: d.climbs.filter((c) => c.key !== key) }));
    setEditingKey(null);
  }

  function addClimb(): void {
    const key = `climb-${nextKey.current++}`;
    setDraft((d) => ({ ...d, climbs: [...d.climbs, newClimb(key, d.scale)] }));
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
      await navigate(`/app/sessions/${encodeURIComponent(session.fingerprint)}`);
    } catch {
      setError("Could not save the session. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="log-session">
      <div className="log-session-grid">
        <div className="log-session-details">
          <Field
            label={
              <>
                SESSION NAME <span style={{ color: "rgba(64,63,76,0.45)" }}>· OPTIONAL</span>
              </>
            }
          >
            <input
              value={draft.name}
              placeholder="Tuesday night session"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="log-session-control"
              style={inputStyle}
            />
          </Field>
          <Field label="DATE">
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className="log-session-control"
              style={inputStyle}
            />
          </Field>
          <div className="log-session-times">
            <Field label="START TIME">
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
                className="log-session-control"
                style={inputStyle}
              />
            </Field>
            <Field label="END TIME">
              <input
                type="time"
                value={draft.endTime}
                onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
                className="log-session-control"
                style={inputStyle}
              />
            </Field>
          </div>
          <Field label="LOCATION">
            <div style={{ display: "flex", gap: 8 }}>
              {(["indoor", "outdoor"] as const).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setDraft({ ...draft, location: loc })}
                  className="log-session-chip"
                  style={chipStyle(draft.location === loc)}
                >
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>
          <Field
            label={
              <>
                TAGS <span style={{ color: "rgba(64,63,76,0.45)" }}>· OPTIONAL</span>
              </>
            }
          >
            <TagPicker
              tags={draft.tags}
              suggestions={suggestionsFor(draft.tags)}
              placeholder="Endurance, Bishop…"
              onAdd={(name) => setDraft((d) => withTag(d, name))}
              onRemove={(name) => setDraft((d) => withoutTag(d, name))}
            />
          </Field>
          <RpePicker rpe={draft.rpe} onChange={(rpe) => setDraft({ ...draft, rpe })} />
          <Field
            label={
              <>
                NOTES <span style={{ color: "rgba(64,63,76,0.45)" }}>· OPTIONAL</span>
              </>
            }
          >
            <textarea
              value={draft.notes}
              rows={4}
              maxLength={SESSION_NOTE_MAX}
              placeholder="How it felt, what to try next time."
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
            <span style={columnHead}>AFTER YOU SAVE</span>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(64,63,76,0.88)" }}>
              {editing === undefined
                ? "sendtally titles the session and builds the climb log. Leave RPE on auto and it is scored against your last 8 weeks of sessions. Notes stay in sendtally and are never posted to Strava."
                : "sendtally rebuilds the title and climb log from these edits. Reset RPE to auto to have it scored against your last 8 weeks of sessions again. Notes stay in sendtally and are never posted to Strava."}
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
              CLIMBS · {draft.climbs.length}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={columnHead}>GRADE SCALE</span>
              {GRADE_SCALE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDraft(withScale(draft, option.value))}
                  aria-pressed={draft.scale === option.value}
                  style={{
                    ...chipStyle(draft.scale === option.value),
                    fontSize: 10,
                    padding: "6px 12px",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {!narrow && (
            <div className="climb-head">
              <span style={columnHead}>GRADE</span>
              <span style={columnHead}>NAME · OPTIONAL</span>
              <span style={columnHead}>TRIES</span>
              <span />
            </div>
          )}
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
                  scale={draft.scale}
                  removable={draft.climbs.length > 1}
                  project={isProject(climb)}
                  suggestions={vocabulary.suggestionsFor(climb.name)}
                  onChange={(c) => updateClimb(climb.key, c)}
                  onChangeName={(name) => updateClimbName(climb.key, name)}
                  onPick={(known) => pickClimb(climb.key, known)}
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
              ADD CLIMB
            </button>
            {narrow && (
              <span style={{ ...columnHead, textAlign: "center" }}>TAP A CLIMB TO EDIT IT</span>
            )}
          </div>
        </div>
      </div>

      {narrow && editingClimb !== null && (
        <ClimbEditorSheet
          climb={editingClimb}
          index={editingIndex}
          count={draft.climbs.length}
          scale={draft.scale}
          project={isProject(editingClimb)}
          suggestions={vocabulary.suggestionsFor(editingClimb.name)}
          onChange={(c) => updateClimb(editingClimb.key, c)}
          onChangeName={(name) => updateClimbName(editingClimb.key, name)}
          onPick={(known) => pickClimb(editingClimb.key, known)}
          onToggleProject={() => toggleProject(editingClimb)}
          onRemove={() => removeClimb(editingClimb.key)}
          onClose={() => setEditingKey(null)}
        />
      )}

      <div className="log-session-actions">
        <div className="log-session-status">
          <span style={monoLabel}>{draftSummary(draft)}</span>
          {error !== null && (
            <span style={{ ...monoLabel, color: "var(--text-label-accent)" }}>{error}</span>
          )}
        </div>
        <div className="log-session-buttons">
          <button
            type="button"
            onClick={() => void navigate(cancelTo)}
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
            Cancel
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
            {saving ? "Saving…" : editing === undefined ? "Log session" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
