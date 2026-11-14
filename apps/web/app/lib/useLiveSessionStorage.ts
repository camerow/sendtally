import { useAuth } from "@clerk/react-router";
import type { DraftStorage } from "@sendtally/features/log-session";
import { localStore } from "./localStorages";

const stores = new Map<string, DraftStorage>();

/** The live climbing session's storage, one per signed-in user, shared so every reader hears a write. */
export function liveSessionStorageOf(userId: string): DraftStorage {
  const key = `sendtally:session-draft:live:${userId}`;
  const known = stores.get(key);
  if (known !== undefined) return known;
  const store = localStore(key);
  stores.set(key, store);
  return store;
}

export function useLiveSessionStorage(): DraftStorage {
  return liveSessionStorageOf(useAuth().userId ?? "");
}
