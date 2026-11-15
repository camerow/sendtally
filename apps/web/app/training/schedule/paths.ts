/** The schedule page for a workout: how often. */
export const schedulePath = (workoutId: string): string =>
  `/app/plan/schedule/${encodeURIComponent(workoutId)}`;

/** The schedule page for an exercise, whose one-exercise workout is made on Add. */
export const exerciseSchedulePath = (exerciseId: string): string =>
  `/app/plan/schedule?exercise=${encodeURIComponent(exerciseId)}`;
