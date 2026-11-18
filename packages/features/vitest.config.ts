import { defineConfig } from "vitest/config";

/** The far east and far west of the clock: a test that reads the host's timezone fails in one. */
const ZONES = ["Pacific/Kiritimati", "Pacific/Pago_Pago"];

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    projects: ZONES.map((TZ) => ({ extends: true, test: { name: TZ, env: { TZ } } })),
  },
});
