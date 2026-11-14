import { climbingSummary } from "./climbingSummary";
import { deleteBlock } from "./deleteBlock";
import { deleteExercise } from "./deleteExercise";
import { deleteWorkout } from "./deleteWorkout";
import { importClimbingLog } from "./importClimbingLog";
import { listSessions } from "./listSessions";
import { logSession } from "./logSession";
import { plan } from "./plan";
import { saveBlock } from "./saveBlock";
import { saveExercise } from "./saveExercise";
import { saveWorkout } from "./saveWorkout";
import { trainingLibrary } from "./trainingLibrary";
import type { ConnectorTool } from "./types";

export const tools: ConnectorTool[] = [
  climbingSummary,
  listSessions,
  trainingLibrary,
  plan,
  saveExercise,
  saveWorkout,
  saveBlock,
  deleteExercise,
  deleteWorkout,
  deleteBlock,
  importClimbingLog,
  logSession,
];
