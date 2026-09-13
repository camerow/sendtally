import { app } from "./app";
import type { Env } from "./bindings";

export default { fetch: app.fetch } satisfies ExportedHandler<Env>;
