import { File, Paths } from "expo-file-system";
import { draftStorage } from "@sendtally/features/log-session";

/** The session logged climb by climb from the log; apart from the form's draft so neither overwrites the other. */
const file = (): File => new File(Paths.document, "live-session.json");

export const liveSessionStorage = draftStorage({
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
