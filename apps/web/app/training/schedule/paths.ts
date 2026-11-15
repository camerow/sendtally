/** The schedule page for a workout: how often. */
export const schedulePath = (workoutId: string): string =>
  `/app/plan/schedule/${encodeURIComponent(workoutId)}`;
