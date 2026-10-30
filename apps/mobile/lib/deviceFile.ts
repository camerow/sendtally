import { File, Paths } from "expo-file-system";
import { draftStorage, type DraftStorage } from "@sendtally/features/log-session";

/** A choice this phone remembers in a small file of its own, for whoever signs in. */
export function deviceFile(name: string): DraftStorage {
  const file = (): File => new File(Paths.document, name);
  return draftStorage({
    read: () => {
      const f = file();
      return f.exists ? f.textSync() : null;
    },
    write: (value) => {
      const f = file();
      if (!f.exists) f.create();
      f.write(value);
    },
    remove: () => {
      const f = file();
      if (f.exists) f.delete();
    },
  });
}
