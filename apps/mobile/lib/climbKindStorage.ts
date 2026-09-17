import { File, Paths } from "expo-file-system";
import { draftStorage } from "@sendtally/features/log-session";

const file = (): File => new File(Paths.document, "climb-kind.txt");

export const climbKindStorage = draftStorage({
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
