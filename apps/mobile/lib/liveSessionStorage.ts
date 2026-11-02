import { userDraftFile } from "./userDraftFile";

/** The session logged climb by climb from the log; apart from the form's draft so neither overwrites the other. */
export const liveSessionStorage = userDraftFile("live-session");
