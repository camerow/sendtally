import { disciplineOf, type ClimbStyle, type Discipline, type GradeScale } from "@sendtally/core";
import { t, upper } from "../i18n";

export type { ClimbStyle, Discipline, GradeScale };
export { disciplineOf };

export type GradeScaleOption = { value: GradeScale; label: string; discipline: Discipline };

export const GRADE_SCALE_OPTIONS: readonly GradeScaleOption[] = [
  {
    value: "v",
    get label() {
      return upper(t("logSession.scaleV"));
    },
    discipline: "boulder",
  },
  {
    value: "font",
    get label() {
      return upper(t("logSession.scaleFont"));
    },
    discipline: "boulder",
  },
  {
    value: "yds",
    get label() {
      return upper(t("logSession.scaleYds"));
    },
    discipline: "route",
  },
  {
    value: "french",
    get label() {
      return upper(t("logSession.scaleFrench"));
    },
    discipline: "route",
  },
];

export type GradePrefs = { boulder: GradeScale; route: GradeScale };

export const DEFAULT_GRADE_PREFS: GradePrefs = { boulder: "v", route: "yds" };

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  get boulder() {
    return t("logSession.boulders");
  },
  get route() {
    return t("logSession.routes");
  },
};

export type ClimbDraft = {
  key: string;
  scale: GradeScale;
  grade: string;
  name: string;
  kind: "send" | "attempt";
  style: ClimbStyle;
  tries: number;
  project?: boolean;
};

/**
 * What a climber picks per climb: how it went, in the vocabulary of its discipline.
 * A boulder is sent or flashed; a route is redpointed, flashed with beta, or
 * onsighted with none. An attempt is the same idea either way.
 */
export type ClimbOutcome = { kind: "send"; style: ClimbStyle } | { kind: "attempt" };

const OUTCOME_STYLES: Record<Discipline, readonly ClimbStyle[]> = {
  boulder: ["redpoint", "flash"],
  route: ["redpoint", "flash", "onsight"],
};

export function sendStylesFor(discipline: Discipline): readonly ClimbStyle[] {
  return OUTCOME_STYLES[discipline];
}

/** Only a redpoint is named differently by discipline: a boulder is just sent. */
export function sendStyleLabel(discipline: Discipline, style: ClimbStyle): string {
  if (style === "flash") return upper(t("logSession.styleFlash"));
  if (style === "onsight") return upper(t("logSession.styleOnsight"));
  return upper(t(discipline === "route" ? "logSession.styleRedpoint" : "logSession.styleSent"));
}

export type LogSessionDraft = {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: "indoor" | "outdoor";
  tags: string[];
  notes: string;
  rpe: number | null;
  climbs: ClimbDraft[];
};
