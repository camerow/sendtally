import { createApp } from "./app";
import { deleteClerkUser, verifyClerkUser, verifyClerkWebhook } from "./auth";
import type { Env } from "./bindings";

const app = createApp({
  verifyUser: verifyClerkUser,
  deleteAuthUser: deleteClerkUser,
  verifyAuthWebhook: verifyClerkWebhook,
});

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
