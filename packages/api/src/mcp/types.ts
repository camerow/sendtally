import type { Context } from "hono";
import type { z } from "zod";
import type { Env } from "../bindings";
import type { AppEnv } from "../context";

// Both directories list a connector's tools by title and refuse one whose
// annotations do not say whether it only reads or can destroy data.
export type ConnectorTool<Shape extends z.ZodRawShape = z.ZodRawShape> = {
  name: string;
  title: string;
  description: string;
  inputSchema: Shape;
  annotations: { readOnlyHint: boolean; destructiveHint: boolean };
  run(
    args: z.infer<z.ZodObject<Shape>>,
    ctx: { env: Env; userId: string; c: Context<AppEnv> }
  ): Promise<unknown>;
};
