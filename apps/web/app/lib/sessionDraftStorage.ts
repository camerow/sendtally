import { draftStorage } from "@sendtally/features/log-session";

const KEY = "sendtally:session-draft:new";

const available = (): boolean => typeof localStorage !== "undefined";

export const sessionDraftStorage = draftStorage({
  read: () => (available() ? localStorage.getItem(KEY) : null),
  write: (value) => {
    if (available()) localStorage.setItem(KEY, value);
  },
  remove: () => {
    if (available()) localStorage.removeItem(KEY);
  },
});
