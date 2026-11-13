import { climbingSummary } from "./climbingSummary";
import { listSessions } from "./listSessions";
import { plan } from "./plan";
import { trainingLibrary } from "./trainingLibrary";
import type { ConnectorTool } from "./types";

export const tools: ConnectorTool[] = [climbingSummary, listSessions, trainingLibrary, plan];
