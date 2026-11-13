import { draftStorage, type DraftStorage } from "@sendtally/features/log-session";

const available = (): boolean => typeof localStorage !== "undefined";

export const localStore = (key: string): DraftStorage =>
  draftStorage({
    read: () => (available() ? localStorage.getItem(key) : null),
    write: (value) => {
      if (available()) localStorage.setItem(key, value);
    },
    remove: () => {
      if (available()) localStorage.removeItem(key);
    },
  });

export const climbKindStorage = localStore("sendtally:climb-kind");
export const sessionDraftStorage = localStore("sendtally:session-draft:new");
