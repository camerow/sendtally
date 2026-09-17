import { draftStorage } from "@sendtally/features/log-session";

const KEY = "sendtally:climb-kind";

const available = (): boolean => typeof localStorage !== "undefined";

export const climbKindStorage = draftStorage({
  read: () => (available() ? localStorage.getItem(KEY) : null),
  write: (value) => {
    if (available()) localStorage.setItem(KEY, value);
  },
  remove: () => {
    if (available()) localStorage.removeItem(KEY);
  },
});
