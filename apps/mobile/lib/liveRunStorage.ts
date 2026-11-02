import { userDraftFile } from "./userDraftFile";

/** The workout running in a player, so the live bar shows it and an app kill does not lose it. */
export const liveRunStorage = userDraftFile("live-run");
