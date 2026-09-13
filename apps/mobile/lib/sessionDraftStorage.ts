import { File, Paths } from "expo-file-system";
import { draftStorage } from "@sendtally/features/log-session";

/** A file rather than SecureStore: a long session's climb list outgrows the keystore value limit. */
const file = (): File => new File(Paths.document, "session-draft.json");

export const sessionDraftStorage = draftStorage({
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
