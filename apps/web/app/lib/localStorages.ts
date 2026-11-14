import { draftStorage, type DraftStorage } from "@sendtally/features/log-session";

const available = (): boolean => typeof localStorage !== "undefined";

/** A value in this browser's local storage, which other tabs' writes to it update too. */
export function localStore(key: string): DraftStorage {
  const store = draftStorage({
    read: () => (available() ? localStorage.getItem(key) : null),
    write: (value) => {
      if (available()) localStorage.setItem(key, value);
    },
    remove: () => {
      if (available()) localStorage.removeItem(key);
    },
  });
  if (typeof window !== "undefined")
    window.addEventListener("storage", (e) => {
      if (e.key === key || e.key === null) store.changed();
    });
  return store;
}

export const climbKindStorage = localStore("sendtally:climb-kind");
export const sessionDraftStorage = localStore("sendtally:session-draft:new");
