export type HangKind = "hang" | "pull";

export type TimeUnit = "s" | "min";

export type WeightUnit = "kg" | "lb";

export type ThemeName = "moss" | "dusk" | "gunmetal";

/** A calendar date in the user's time zone, "YYYY-MM-DD". Never a timestamp. */
export type CalendarDate = string;

/** Weekday number, 0 = Monday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Protocol = {
  name: string;
  kind: HangKind;
  hangS: number;
  restS: number;
  reps: number;
  sets: number;
  setRestS: number;
  edgeMm: number;
};

export type TimeField = "hangS" | "restS" | "setRestS";

export type TimeUnits = Record<TimeField, TimeUnit>;

/** A deleted custom grip is hidden, not removed: its sessions and trend keep its name. */
export type Grip = { id: string; name: string; custom: boolean; hidden: boolean };

export type Workout = Protocol & {
  id: string;
  source: "library" | "mine";
  grip: string;
  timeUnits: TimeUnits;
};

/** Load in kg per workout × grip, keyed `${workoutId}:${gripId}`. */
export type Loads = Record<string, number>;

export type Schedule = {
  id: string;
  workoutId: string;
  gripId: string;
  days: Weekday[];
  start: CalendarDate;
  /** Exclusive; null means ongoing. */
  end: CalendarDate | null;
  skip: CalendarDate[];
  /** Absent from app builds before blocks. */
  targetRpe?: number | null;
  /** The training block it belongs to; absent from app builds before blocks. */
  blockId?: string | null;
};

export type BlockPhase = "build" | "deload" | "test";

/** A week of a block: its load as a percent of the block's base, and an optional phase tag. */
export type WeekLoad = { load: number; phase?: BlockPhase };

/** A multi-week block. Its members share its dates. */
export type TrainingBlock = {
  id: string;
  name: string;
  start: CalendarDate;
  weeks: number;
  /** One per week. */
  loads: WeekLoad[];
  notes: string | null;
  /** Exclusive; set when the block was ended early. */
  endedOn: CalendarDate | null;
};

export type HangSession = {
  id: string;
  workoutId: string;
  gripId: string;
  date: CalendarDate;
  loadKg: number;
  pct: number;
  misses: number;
  rpe: number | null;
  protocol: Protocol;
};

export type HangSettings = {
  units: WeightUnit;
  theme: ThemeName;
  reminders: boolean;
  /** "HH:MM", local time. */
  reminderTime: string;
  postToStrava: boolean;
  reminderPromptSeen: boolean;
};
