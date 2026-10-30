import { draftStorage } from "@sendtally/features/log-session";

let value: string | null = null;

/** The live run in memory, for tests: `jest.mock` of `lib/liveRunStorage` picks it up. */
export const liveRunStorage = draftStorage({
  read: () => value,
  write: (next) => {
    value = next;
  },
  remove: () => {
    value = null;
  },
});
