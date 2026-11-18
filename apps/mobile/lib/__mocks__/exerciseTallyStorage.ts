import { draftStorage } from "@sendtally/features/log-session";

let value: string | null = null;

/** The workout tally in memory, for tests; mocked for every test in `jest.setup.ts`. */
export const exerciseTallyStorage = draftStorage({
  read: () => value,
  write: (next) => {
    value = next;
  },
  remove: () => {
    value = null;
  },
});
