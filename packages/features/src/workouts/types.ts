import type {
  ClimbFocus,
  PlanKind,
  UserWorkoutInput,
  Workout,
  WorkoutBody,
} from "@sendtally/api-client";
import type { CalendarDate } from "@sendtally/core/hang";

/** What a library workout trains: a hangboard workout, or any plan item kind. */
export type WorkoutCategory = "hang" | PlanKind;

/** A hangboard protocol, or what a plan item prescribes, or a climbing session's focus. */
export type LibraryBody = { kind: "hang"; workout: Workout } | WorkoutBody;

export type LibrarySource = "library" | "mine";

/** One workout in the library, built in or the user's own, of any category. */
export type LibraryWorkout = {
  id: string;
  source: LibrarySource;
  category: WorkoutCategory;
  name: string;
  description: string | null;
  tags: string[];
  minutes: number | null;
  targetRpe: number | null;
  body: LibraryBody | null;
};

/** A non-hangboard workout as the user saves it. */
export type WorkoutDraft = UserWorkoutInput;

export type WorkoutUse = { count: number; last: CalendarDate | null };

export type LibrarySort = "recent" | "most" | "name" | "duration";

export type LibraryFilter = {
  text: string;
  /** Empty is every category. */
  categories: WorkoutCategory[];
  source: LibrarySource | "all";
  sort: LibrarySort;
};

export type { ClimbFocus };
