import React from "react";
import {
  CIRCUIT_COLOURS,
  circuitLabel,
  circuitMiddle,
  colourName,
  gradeLabel,
  MAX_CIRCUIT_GRADE,
  withCircuitRange,
  type Circuit,
  type CircuitColour,
  type GymScale,
} from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { CircuitDot } from "../../components/CircuitDot";
import { Icon } from "../../components/Icon";
import { columnHead, inputStyle } from "../../log-session/components/styles";

const grades = Array.from({ length: MAX_CIRCUIT_GRADE + 1 }, (_, v) => v);

const control: React.CSSProperties = { ...inputStyle, height: 44, padding: "0 12px" };

function GradeSelect({
  label,
  value,
  scale,
  onChange,
}: {
  label: string;
  value: number;
  scale: GymScale;
  onChange: (v: number) => void;
}): React.ReactElement {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="log-session-control"
      style={{ ...control, width: 92, fontFamily: "var(--font-mono)", fontWeight: 600 }}
    >
      {grades.map((v) => (
        <option key={v} value={v}>
          {gradeLabel(v, scale)}
        </option>
      ))}
    </select>
  );
}

export function CircuitRow({
  circuit,
  scale,
  onChange,
  onRemove,
}: {
  circuit: Circuit;
  scale: GymScale;
  onChange: (circuit: Circuit) => void;
  onRemove: () => void;
}): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "12px 0",
        borderBottom: "1px solid var(--line-on-light-soft)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ position: "relative", display: "inline-flex", flex: "none" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              pointerEvents: "none",
            }}
          >
            <CircuitDot colour={circuit.colour} size={16} />
          </span>
          <select
            aria-label={t("gyms.colour")}
            value={circuit.colour}
            onChange={(e) => onChange({ ...circuit, colour: e.target.value as CircuitColour })}
            className="log-session-control"
            style={{ ...control, width: 132, paddingLeft: 36 }}
          >
            {CIRCUIT_COLOURS.map((colour) => (
              <option key={colour} value={colour}>
                {colourName(colour)}
              </option>
            ))}
          </select>
        </span>
        <input
          value={circuit.label}
          placeholder={colourName(circuit.colour)}
          autoComplete="off"
          maxLength={40}
          aria-label={t("gyms.circuit")}
          onChange={(e) => onChange({ ...circuit, label: e.target.value })}
          className="log-session-control"
          style={{ ...control, flex: 1, minWidth: 0, fontWeight: 600 }}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("gyms.removeCircuit")}
          style={{
            width: 36,
            height: 44,
            flex: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "rgba(64,63,76,0.45)",
          }}
        >
          <Icon name="x" size={16} strokeWidth={2} />
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <GradeSelect
          label={t("gyms.from")}
          value={circuit.low}
          scale={scale}
          onChange={(v) => onChange(withCircuitRange(circuit, "low", v))}
        />
        <GradeSelect
          label={t("gyms.to")}
          value={circuit.high}
          scale={scale}
          onChange={(v) => onChange(withCircuitRange(circuit, "high", v))}
        />
        <span
          style={{
            ...columnHead,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {t("gyms.scoredAs", { grade: gradeLabel(circuitMiddle(circuit), scale) })} ·{" "}
          {circuitLabel(circuit)}
        </span>
      </div>
    </div>
  );
}
