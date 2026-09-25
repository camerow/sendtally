import { draftStorage } from "@sendtally/features/log-session";

const KEY = "sendtally:session-draft:live";

const available = (): boolean => typeof localStorage !== "undefined";

/** The session logged climb by climb from the log; apart from the form's draft so neither overwrites the other. */
export const liveSessionStorage = draftStorage({
  read: () => (available() ? localStorage.getItem(KEY) : null),
  write: (value) => {
    if (available()) localStorage.setItem(KEY, value);
  },
  remove: () => {
    if (available()) localStorage.removeItem(KEY);
  },
});
