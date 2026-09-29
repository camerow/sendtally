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

export type Grip = { id: string; name: string; custom: boolean };

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
