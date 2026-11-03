/** A workout's key in the log: its library id, else its title. */
export const workoutKeyOf = (s: { workoutId: string | null; title: string }): string =>
  s.workoutId ?? `title:${s.title.trim().toLowerCase()}`;
