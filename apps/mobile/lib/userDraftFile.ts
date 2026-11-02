import { File, Paths } from "expo-file-system";
import { draftStorage, type DraftStorage } from "@sendtally/features/log-session";

let owner: string | null = null;
const stores: DraftStorage[] = [];

export function setDraftOwner(userId: string | null): void {
  if (userId === owner) return;
  owner = userId;
  stores.forEach((s) => s.changed());
}

/** A draft in a file of the signed-in account's own, so another account on this phone never opens it. */
export function userDraftFile(name: string): DraftStorage {
  const file = (): File | null => {
    if (owner === null) return null;
    const mine = new File(Paths.document, `${name}-${owner}.json`);
    const shared = new File(Paths.document, `${name}.json`);
    if (!mine.exists && shared.exists) shared.rename(`${name}-${owner}.json`);
    return mine;
  };
  const store = draftStorage({
    read: () => {
      const f = file();
      return f?.exists === true ? f.textSync() : null;
    },
    write: (value) => {
      const f = file();
      if (f === null) throw new Error("No account to keep a draft for");
      if (!f.exists) f.create();
      f.write(value);
    },
    remove: () => {
      const f = file();
      if (f?.exists === true) f.delete();
    },
  });
  stores.push(store);
  return store;
}
