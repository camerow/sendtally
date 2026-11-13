import { climbingSummary } from "./climbingSummary";
import { importClimbingLog } from "./importClimbingLog";
import { listSessions } from "./listSessions";
import { logSession } from "./logSession";
import { plan } from "./plan";
import { trainingLibrary } from "./trainingLibrary";
import type { ConnectorTool } from "./types";

export const tools: ConnectorTool[] = [
  climbingSummary,
  listSessions,
  trainingLibrary,
  plan,
  importClimbingLog,
  logSession,
];
