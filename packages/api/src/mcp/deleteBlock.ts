import { id } from "../lib/plan";
import * as repo from "../lib/repo";
import { owned } from "./saveExercise";
import type { ConnectorTool } from "./types";

const inputSchema = { id: id.describe("The block's id, from get_plan.") };

export const deleteBlock: ConnectorTool<typeof inputSchema> = {
  name: "delete_block",
  title: "Delete training block",
  description:
    "Deletes one of the user's training blocks, dated or template, with its workouts' places in it, their weekdays, skipped days and week changes. The workouts stay in the library, and sessions already logged against the block keep what was done. Confirm with the user first; it cannot be undone.",
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: true },
  run: async ({ id: blockId }, { env, userId }) => ({
    deleted: owned(await repo.deleteBlock(env.DB, userId, blockId), "block", blockId),
  }),
};
