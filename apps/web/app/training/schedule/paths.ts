/** The schedule page for a workout: how often, and in which block. */
export const schedulePath = (workoutId: string): string =>
  `/app/plan/schedule/${encodeURIComponent(workoutId)}`;
