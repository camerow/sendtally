import React from "react";
import { useNavigate } from "react-router";
import type { SendtallyApi } from "@sendtally/api-client";
import {
  GRADE_SCALE_OPTIONS,
  draftProblem,
  draftSummary,
  emptyDraft,
  gradeOptions,
  newClimb,
  toLogSessionInput,
  withScale,
  withTag,
  withoutTag,
  type ClimbDraft,
  type GradeScale,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { useTagVocabulary } from "@sendtally/features/sessions";
import { TagPicker } from "../../components/TagPicker";

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  color: "rgba(64,63,76,0.72)",
};

const columnHead: React.CSSProperties = {
  ...monoLabel,
  fontSize: 10,
  color: "rgba(64,63,76,0.55)",
};

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  color: "var(--bs-gunmetal)",
  background: "var(--bs-white)",
  border: "1px solid rgba(64,63,76,0.15)",
  borderRadius: "var(--radius-control)",
  padding: "12px 14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
  padding: "10px 16px",
  borderRadius: "var(--radius-pill)",
  cursor: "pointer",
  background: active ? "var(--bs-gold)" : "transparent",
  color: active ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.65)",
  border: active ? "1px solid var(--bs-gold)" : "1px solid rgba(64,63,76,0.18)",
});

const stepperButton: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(64,63,76,0.18)",
  background: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--bs-gunmetal)",
};

function Glyph({
  d,
  size = 15,
  width = 1.8,
}: {
  d: string;
  size?: number;
  width?: number;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none" }}
    >
      <path d={d} />
    </svg>
  );
}

const PLUS = "M8 3.6V12.4M3.6 8H12.4";
const MINUS = "M3.6 8H12.4";
const CROSS = "M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8";
const CHECK = "M3 8.4 6.2 11.6 12.6 4.8";

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

function ResultButton({
  active,
  activeBackground,
  glyph,
  label,
  onClick,
}: {
  active: boolean;
  activeBackground: string;
  glyph: string;
  label: string;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...chipStyle(false),
        flex: 1,
        minWidth: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontSize: 10,
        padding: "8px 12px",
        ...(active
          ? {
              background: activeBackground,
              color: "var(--bs-white)",
              border: `1px solid ${activeBackground}`,
            }
          : {}),
      }}
    >
      <Glyph d={glyph} size={13} width={2} />
      {label}
    </button>
  );
}

function ClimbRow({
  climb,
  scale,
  removable,
  onChange,
  onRemove,
}: {
  climb: ClimbDraft;
  scale: GradeScale;
  removable: boolean;
  onChange: (climb: ClimbDraft) => void;
  onRemove: () => void;
}): React.ReactElement {
  return (
    <div className="climb-row">
      <select
        value={climb.grade}
        onChange={(e) => onChange({ ...climb, grade: e.target.value })}
        className="climb-grade log-session-control"
        style={{
          ...inputStyle,
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          padding: "11px 8px",
        }}
      >
        {gradeOptions(scale).map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <input
        value={climb.name}
        placeholder="Name (optional)"
        onChange={(e) => onChange({ ...climb, name: e.target.value })}
        className="climb-name log-session-control"
        style={inputStyle}
      />
      <div className="climb-result" style={{ display: "flex", gap: 6, minWidth: 0 }}>
        <ResultButton
          active={climb.kind === "send"}
          activeBackground="var(--bs-azure-ink)"
          glyph={CHECK}
          label="SEND"
          onClick={() => onChange({ ...climb, kind: "send" })}
        />
        <ResultButton
          active={climb.kind === "attempt"}
          activeBackground="var(--bs-gunmetal)"
          glyph={CROSS}
          label="ATTEMPT"
          onClick={() => onChange({ ...climb, kind: "attempt" })}
        />
      </div>
      <div
        className="climb-tries"
        style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}
      >
        <button
          type="button"
          aria-label="Fewer tries"
          disabled={climb.tries <= 1}
          onClick={() => onChange({ ...climb, tries: climb.tries - 1 })}
          className="climb-step"
          style={{ ...stepperButton, opacity: climb.tries <= 1 ? 0.4 : 1 }}
        >
          <Glyph d={MINUS} />
        </button>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            fontSize: 15,
            width: 18,
            textAlign: "center",
          }}
        >
          {climb.tries}
        </span>
        <button
          type="button"
          aria-label="More tries"
          onClick={() => onChange({ ...climb, tries: Math.min(99, climb.tries + 1) })}
          className="climb-step"
          style={stepperButton}
        >
          <Glyph d={PLUS} />
        </button>
      </div>
      <button
        type="button"
        aria-label="Remove climb"
        disabled={!removable}
        onClick={onRemove}
        className="climb-remove"
        style={{
          ...stepperButton,
          border: "none",
          color: "rgba(64,63,76,0.45)",
          opacity: removable ? 1 : 0,
        }}
      >
        <Glyph d={CROSS} width={1.7} />
      </button>
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
  const cancelTo =
    editing === undefined ? "/app" : `/app/sessions/${encodeURIComponent(editing.fingerprint)}`;

  const problem = draftProblem(draft);

  function updateClimb(key: string, climb: ClimbDraft): void {
    setDraft((d) => ({ ...d, climbs: d.climbs.map((c) => (c.key === key ? climb : c)) }));
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
                ? "sendtally titles the session and builds the climb log. Leave RPE on auto and it is scored against your last 8 weeks of sessions."
                : "sendtally rebuilds the title and climb log from these edits. Reset RPE to auto to have it scored against your last 8 weeks of sessions again."}
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
          <div className="climb-head">
            <span style={columnHead}>GRADE</span>
            <span style={columnHead}>NAME · OPTIONAL</span>
            <span style={columnHead}>RESULT</span>
            <span style={columnHead}>TRIES</span>
            <span />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {draft.climbs.map((climb) => (
              <ClimbRow
                key={climb.key}
                climb={climb}
                scale={draft.scale}
                removable={draft.climbs.length > 1}
                onChange={(c) => updateClimb(climb.key, c)}
                onRemove={() =>
                  setDraft((d) => ({ ...d, climbs: d.climbs.filter((c) => c.key !== climb.key) }))
                }
              />
            ))}
            <button
              type="button"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  climbs: [...d.climbs, newClimb(`climb-${nextKey.current++}`, d.scale)],
                }))
              }
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
          </div>
        </div>
      </div>

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
