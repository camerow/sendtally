import { userDraftFile } from "./userDraftFile";

/** A file rather than SecureStore: a long session's climb list outgrows the keystore value limit. */
export const sessionDraftStorage = userDraftFile("session-draft");
