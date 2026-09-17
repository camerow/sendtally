import React from "react";
import {
  customStart,
  gymDraftProblem,
  nextCircuit,
  standardCircuits,
  withoutWall,
  withWall,
  type Circuit,
  type CircuitMode,
  type GymDraft,
  type GymScale,
} from "@sendtally/features/gyms";
import { scaleLabel } from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { BackLink } from "../../components/BackLink";
import { chipStyle } from "../../components/chip";
import { Icon } from "../../components/Icon";
import { inputStyle } from "../../log-session/components/styles";
import { Section } from "../../settings/components/Section";
import {
  bodyText,
  dangerButton,
  messageText,
  pageTitle,
  secondaryButton,
  sectionLabel,
  underlineButton,
} from "../../settings/components/styles";
import { CircuitRow } from "./CircuitRow";

const control: React.CSSProperties = { ...inputStyle, height: 44, padding: "0 12px" };

const addButton: React.CSSProperties = {
  ...secondaryButton,
  fontSize: 14,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

export type GymEditorProps = {
  initial: GymDraft;
  saving: boolean;
  error: string | null;
  onSave: (draft: GymDraft) => void;
  onDelete: (() => void) | null;
};

/** One page for a new gym and for editing one; nothing is written until Save. */
export function GymEditor({
  initial,
  saving,
  error,
  onSave,
  onDelete,
}: GymEditorProps): React.ReactElement {
  const [draft, setDraft] = React.useState<GymDraft>(initial);
  const [mode, setMode] = React.useState<CircuitMode>("standard");
  const [wall, setWall] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const setCircuits = (circuits: Circuit[]): void => setDraft((d) => ({ ...d, circuits }));
  const changeMode = (next: CircuitMode): void => {
    setMode(next);
    setCircuits(next === "standard" ? standardCircuits() : customStart());
  };
  const addWall = (): void => {
    setDraft((d) => ({ ...d, walls: withWall(d.walls, wall) }));
    setWall("");
  };
  const save = (): void => {
    const p = gymDraftProblem(draft);
    setProblem(p);
    if (p === null) onSave({ ...draft, name: draft.name.trim() });
  };

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 14 }}>
      <BackLink to="/app/settings">{t("common.settings")}</BackLink>
      <h1 style={pageTitle}>{initial.id === null ? t("gyms.newGym") : t("gyms.editGym")}</h1>

      <Section>
        <label htmlFor="gym-name" style={sectionLabel}>
          {t("gyms.gymName")}
        </label>
        <input
          id="gym-name"
          value={draft.name}
          placeholder={t("gyms.gymName")}
          autoComplete="off"
          maxLength={80}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          className="log-session-control"
          style={control}
        />
      </Section>

      <Section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={sectionLabel}>{t("gyms.circuits")}</span>
          <select
            aria-label={t("gyms.scale")}
            value={draft.scale}
            onChange={(e) => setDraft((d) => ({ ...d, scale: e.target.value as GymScale }))}
            className="log-session-control"
            style={{ ...control, width: 110, fontFamily: "var(--font-mono)", fontWeight: 600 }}
          >
            {(["v", "font"] as const satisfies readonly GymScale[]).map((scale) => (
              <option key={scale} value={scale}>
                {scaleLabel(scale)}
              </option>
            ))}
          </select>
        </div>
        <div role="radiogroup" aria-label={t("gyms.circuits")} style={{ display: "flex", gap: 8 }}>
          {(["standard", "custom"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={m === mode}
              onClick={() => changeMode(m)}
              style={chipStyle(m === mode, { padding: "10px 16px" })}
            >
              {m === "standard" ? t("gyms.standard") : t("gyms.custom")}
            </button>
          ))}
        </div>
        <p style={bodyText}>
          {mode === "standard" ? t("gyms.modeStandard") : t("gyms.modeCustom")}
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {draft.circuits.map((circuit) => (
            <CircuitRow
              key={circuit.id}
              circuit={circuit}
              scale={draft.scale}
              onChange={(next) =>
                setCircuits(draft.circuits.map((c) => (c.id === next.id ? next : c)))
              }
              onRemove={() =>
                setDraft((d) => ({ ...d, circuits: d.circuits.filter((c) => c.id !== circuit.id) }))
              }
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setDraft((d) => ({ ...d, circuits: [...d.circuits, nextCircuit(d.circuits)] }))
          }
          style={addButton}
        >
          <Icon name="plus" size={16} strokeWidth={2.2} />
          {t("gyms.addCircuit")}
        </button>
      </Section>

      <Section>
        <span style={sectionLabel}>{t("gyms.walls")}</span>
        {draft.walls.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {draft.walls.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, walls: withoutWall(d.walls, w) }))}
                aria-label={`${t("gyms.removeWall")}: ${w}`}
                style={chipStyle(false, {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--bs-gunmetal)",
                })}
              >
                {w}
                <Icon name="x" size={12} strokeWidth={2.2} />
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addWall();
          }}
          style={{ display: "flex", gap: 10 }}
        >
          <input
            value={wall}
            placeholder={t("gyms.wallPlaceholder")}
            aria-label={t("gyms.addWall")}
            autoComplete="off"
            maxLength={40}
            onChange={(e) => setWall(e.target.value)}
            className="log-session-control"
            style={{ ...control, flex: 1, minWidth: 0 }}
          />
          <button
            type="submit"
            disabled={wall.trim() === ""}
            aria-label={t("gyms.addWall")}
            style={{
              ...addButton,
              width: 44,
              height: 44,
              padding: 0,
              flex: "none",
              opacity: wall.trim() === "" ? 0.4 : 1,
            }}
          >
            <Icon name="plus" size={16} strokeWidth={2.2} />
          </button>
        </form>
      </Section>

      {(problem ?? error) !== null && (
        <span style={{ ...messageText, color: "var(--bs-watermelon-ink)" }}>
          {problem ?? error}
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={save}
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
          {saving ? t("gyms.saving") : t("gyms.save")}
        </button>
      </div>

      {onDelete !== null && (
        <Section>
          <span style={sectionLabel}>{t("gyms.deleteGym")}</span>
          {confirmingDelete ? (
            <>
              <p style={bodyText}>{t("gyms.deleteConfirm", { name: draft.name })}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button type="button" onClick={onDelete} style={dangerButton}>
                  {t("gyms.deleteGym")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  style={underlineButton}
                >
                  {t("common.cancel")}
                </button>
              </div>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmingDelete(true)} style={dangerButton}>
              {t("gyms.deleteGym")}
            </button>
          )}
        </Section>
      )}
    </div>
  );
}
