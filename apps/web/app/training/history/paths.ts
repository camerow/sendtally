/** A workout's one history view; `current` marks the finished workout it was opened from. */
export const workoutHistoryPath = (id: string, current?: string): string =>
  `/app/train/workouts/${encodeURIComponent(id)}/history${
    current === undefined ? "" : `?${new URLSearchParams({ current })}`
  }`;
