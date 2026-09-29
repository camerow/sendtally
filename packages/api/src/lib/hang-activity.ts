import {
  toUnit,
  totalSeconds,
  type HangSession,
  type Protocol,
  type WeightUnit,
} from "@sendtally/core/hang";
import type { StravaActivity } from "./strava";

const plural = (n: number, word: string, many = `${word}s`): string =>
  `${n} ${n === 1 ? word : many}`;

function duration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min === 0) return `${sec} s`;
  return sec === 0 ? `${min} min` : `${min} min ${sec} s`;
}

function protocolLine(p: Protocol): string {
  const parts =
    p.kind === "pull"
      ? [`${plural(p.sets, "set")} × ${plural(p.reps, "lift")}`]
      : [
          `${plural(p.sets, "set")} × ${plural(p.reps, "hang")}`,
          p.restS > 0
            ? `${duration(p.hangS)} on, ${duration(p.restS)} off`
            : `${duration(p.hangS)} on`,
        ];
  if (p.sets > 1 && p.setRestS > 0) parts.push(`${duration(p.setRestS)} between sets`);
  if (p.edgeMm > 0) parts.push(`${p.edgeMm} mm edge`);
  return parts.join(" · ");
}

/** "+4 kg", "−15 kg" or "bodyweight" on a hang; a ground pull lifts "30 kg". */
export function loadLabel(kind: Protocol["kind"], kg: number, unit: WeightUnit): string {
  const value = toUnit(kg, unit);
  if (kind === "pull") return `${Math.max(0, value)} ${unit}`;
  if (value === 0) return "bodyweight";
  return value > 0 ? `+${value} ${unit}` : `−${-value} ${unit}`;
}

export function hangTitle(s: Pick<HangSession, "protocol">, gripName: string): string {
  return `${s.protocol.name} · ${gripName}`;
}

// Strava's public API drops perceived_exertion, so the effort rides in the
// description's first line, as it does for a climbing session.
export function hangDescription(s: HangSession, unit: WeightUnit): string {
  const result = [
    ...(s.rpe === null ? [] : [`RPE ${s.rpe}/10`]),
    `${s.pct}% complete`,
    ...(s.misses === 0 ? [] : [plural(s.misses, "miss", "misses")]),
  ];
  return [
    result.join(" · "),
    "created by https://sendtally.com",
    protocolLine(s.protocol),
    `Load ${loadLabel(s.protocol.kind, s.loadKg, unit)}`,
  ].join("\n");
}

// A hang session is a calendar date with no clock time, so it lands at local
// noon on that day. Hangboarding and ground pulls are strength training, which
// Strava files under Workout.
export function hangActivity(s: HangSession, gripName: string, unit: WeightUnit): StravaActivity {
  return {
    name: hangTitle(s, gripName),
    description: hangDescription(s, unit),
    sportType: "Workout",
    startDateLocal: new Date(`${s.date}T12:00:00Z`),
    elapsedSeconds: totalSeconds(s.protocol),
  };
}
