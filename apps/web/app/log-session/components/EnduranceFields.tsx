import React from "react";
import {
  addLap,
  enduranceAmountLabel,
  enduranceLapValueLabel,
  enduranceOf,
  enduranceProgressLabel,
  enduranceUnitLabel,
  isCleanLap,
  FELL_AFTER_START,
  removeLap,
  withEnduranceTarget,
  withEnduranceUnit,
  withLap,
  type ClimbDraft,
  type Endurance,
  type EnduranceUnit,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { Glyph } from "./Glyph";
import { CHECK, inputStyle, monoLabel } from "./styles";

const MAX_SECONDS = 3600;

/** Moves are typed as moves; time is typed in minutes, which is how every label reads it back. */
function unitScale(unit: EnduranceUnit): number {
  return unit === "moves" ? 1 : 60;
}

const numberStyle: React.CSSProperties = {
  ...inputStyle,
  height: 40,
  padding: "0 8px",
  textAlign: "center",
  fontFamily: "var(--font-mono)",
  fontWeight: 600,
  fontSize: 14,
};

/** An emptied box commits nothing, so backspacing through a value does not snap it to the floor. */
function NumberField({
  value,
  min,
  max,
  label,
  width,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  width?: number;
  onCommit: (value: number) => void;
}): React.ReactElement {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={1}
      value={value}
      aria-label={label}
      onChange={(e) => {
        if (e.target.value.trim() !== "") onCommit(Number(e.target.value));
      }}
      className="log-session-control"
      style={{ ...numberStyle, ...(width === undefined ? {} : { width }) }}
    />
  );
}

export type EnduranceProps = {
  climb: ClimbDraft;
  onChange: (climb: ClimbDraft) => void;
};

export function EnduranceTargetField({ climb, onChange }: EnduranceProps): React.ReactElement {
  const endurance = enduranceOf(climb);
  const scale = unitScale(endurance.unit);
  return (
    <NumberField
      value={endurance.target / scale}
      min={1}
      max={MAX_SECONDS / scale}
      label={`${t("endurance.oneLapIs")} (${enduranceUnitLabel(endurance.unit)})`}
      onCommit={(value) => onChange(withEnduranceTarget(climb, value * scale))}
    />
  );
}

export function EnduranceUnitField({
  climb,
  style,
  onChange,
}: EnduranceProps & { style?: React.CSSProperties }): React.ReactElement {
  const endurance = enduranceOf(climb);
  return (
    <select
      aria-label={t("endurance.unit")}
      value={endurance.unit}
      onChange={(e) => onChange(withEnduranceUnit(climb, e.target.value as EnduranceUnit))}
      className="log-session-control"
      style={{ ...inputStyle, height: 40, padding: "0 10px", ...style }}
    >
      {(["moves", "seconds"] as const).map((unit) => (
        <option key={unit} value={unit}>
          {enduranceUnitLabel(unit)}
        </option>
      ))}
    </select>
  );
}

/** Colour carries the outcome, border weight carries the selection. */
function LapButton({
  endurance,
  index,
  selected,
  onSelect,
}: {
  endurance: Endurance;
  index: number;
  selected: boolean;
  onSelect: () => void;
}): React.ReactElement {
  const clean = isCleanLap(endurance, index);
  const value = enduranceLapValueLabel(endurance, index);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${t("endurance.lapNumber", { n: index + 1 })}, ${clean ? t("endurance.completed") : value}`}
      onClick={onSelect}
      className="lap-chip"
      style={{
        width: clean ? 54 : 74,
        border: `${selected ? 2 : 1}px solid ${clean ? "var(--bs-fern)" : "var(--bs-watermelon-ink)"}`,
        color: clean ? "var(--bs-fern)" : "var(--bs-gunmetal)",
      }}
    >
      {clean ? <Glyph d={CHECK} size={15} width={2.4} /> : value}
    </button>
  );
}

export function EnduranceLaps({
  climb,
  selected,
  onSelect,
  onChange,
}: EnduranceProps & {
  selected: number;
  onSelect: (index: number) => void;
}): React.ReactElement {
  const endurance = enduranceOf(climb);
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, minWidth: 0 }}>
      <div role="radiogroup" aria-label={t("endurance.laps")} style={{ display: "flex", gap: 8 }}>
        {endurance.laps.map((_, i) => (
          <LapButton
            key={i}
            endurance={endurance}
            index={i}
            selected={i === selected}
            onSelect={() => onSelect(i)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          onSelect(endurance.laps.length);
          onChange(addLap(climb));
        }}
        className="lap-add"
      >
        {t("endurance.addLap")}
      </button>
      {endurance.laps.length > 1 && (
        <button
          type="button"
          onClick={() => {
            onSelect(endurance.laps.length - 2);
            onChange(removeLap(climb));
          }}
          className="lap-add lap-remove"
        >
          {t("endurance.removeLap")}
        </button>
      )}
      <span style={{ ...monoLabel, flexGrow: 1, letterSpacing: "0.06em", textAlign: "right" }}>
        {enduranceProgressLabel(endurance)}
      </span>
    </div>
  );
}

/** Completed or fell after, and how far the lap got when it was the latter. */
export function EnduranceLapOutcome({
  climb,
  selected,
  onChange,
}: EnduranceProps & { selected: number }): React.ReactElement {
  const endurance = enduranceOf(climb);
  const clean = isCleanLap(endurance, selected);
  const scale = unitScale(endurance.unit);
  const lap = endurance.laps[selected] ?? 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <select
        aria-label={t("endurance.lapNumber", { n: selected + 1 })}
        value={clean ? "clean" : "partial"}
        onChange={(e) =>
          onChange(
            withLap(
              climb,
              selected,
              e.target.value === "clean" ? endurance.target : FELL_AFTER_START
            )
          )
        }
        className="log-session-control"
        style={{ ...inputStyle, width: 150, height: 40, padding: "0 12px" }}
      >
        <option value="clean">{t("endurance.completed")}</option>
        <option value="partial">{t("endurance.fellAfter")}</option>
      </select>
      {!clean && (
        <>
          <NumberField
            value={lap / scale}
            min={0}
            max={endurance.target / scale}
            width={64}
            label={t("endurance.lapDone")}
            onCommit={(value) => onChange(withLap(climb, selected, value * scale))}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              fontSize: 13,
              color: "rgba(64,63,76,0.72)",
              whiteSpace: "nowrap",
            }}
          >
            {`/${enduranceAmountLabel(endurance, endurance.target)}`}
          </span>
        </>
      )}
    </div>
  );
}

/** The lap being detailed, kept in range as laps are added and the circuit is re-cut. */
export function useSelectedLap(climb: ClimbDraft): [number, (index: number) => void] {
  const count = enduranceOf(climb).laps.length;
  const [picked, setPicked] = React.useState(count - 1);
  return [Math.min(picked, count - 1), setPicked];
}
