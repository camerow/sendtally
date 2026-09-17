import React from "react";
import {
  circuitGrades,
  circuitLabel,
  circuitRangeLabel,
  findCircuit,
  withCircuit,
  type Gym,
} from "@sendtally/features/gyms";
import type { ClimbDraft } from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { CircuitDot } from "../../components/CircuitDot";
import { chipStyle } from "../../components/chip";
import { columnHead } from "../../log-session/components/styles";

function ChoiceChip({
  label,
  active,
  leading,
  mono = false,
  onPress,
}: {
  label: string;
  active: boolean;
  leading?: React.ReactNode;
  mono?: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onPress}
      style={chipStyle(active, {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        minHeight: 36,
        boxSizing: "border-box",
        ...(mono
          ? { fontWeight: 600, fontSize: 12 }
          : {
              fontFamily: "var(--font-sans)",
              textTransform: "none",
              letterSpacing: 0,
              fontWeight: 600,
              fontSize: 13,
            }),
      })}
    >
      {leading}
      {label}
    </button>
  );
}

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={columnHead}>{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        style={{ display: "flex", flexWrap: "wrap", gap: 7 }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Circuit, wall and how it felt, in place of the grade. The felt-like row is only the grades the
 * circuit spans, with the middle already chosen; nobody is asked to estimate.
 */
export function CircuitFields({
  climb,
  gym,
  onChange,
}: {
  climb: ClimbDraft;
  gym: Gym;
  onChange: (climb: ClimbDraft) => void;
}): React.ReactElement {
  const current = findCircuit(gym, climb.circuit?.id);
  const wall = climb.wall ?? "";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <ChipRow label={t("gyms.circuit")}>
        {gym.circuits.map((circuit) => (
          <ChoiceChip
            key={circuit.id}
            label={circuitLabel(circuit)}
            active={circuit.id === current?.id}
            leading={<CircuitDot colour={circuit.colour} size={12} />}
            onPress={() => onChange(withCircuit(climb, circuit, gym))}
          />
        ))}
      </ChipRow>
      {current !== null && (
        <span style={{ ...columnHead, marginTop: -5 }}>
          {circuitRangeLabel(current, gym.scale)}
        </span>
      )}
      {gym.walls.length > 0 && (
        <ChipRow label={t("gyms.wall")}>
          {["", ...gym.walls].map((w) => (
            <ChoiceChip
              key={w === "" ? "-" : w}
              label={w === "" ? t("gyms.noWall") : w}
              active={w === wall}
              onPress={() => onChange({ ...climb, wall: w })}
            />
          ))}
        </ChipRow>
      )}
      {current !== null && current.low !== current.high && (
        <ChipRow label={t("gyms.feltLike")}>
          {circuitGrades(current, gym.scale).map((grade) => (
            <ChoiceChip
              key={grade}
              label={grade}
              mono
              active={grade === climb.grade}
              onPress={() => onChange({ ...climb, grade })}
            />
          ))}
        </ChipRow>
      )}
    </div>
  );
}
