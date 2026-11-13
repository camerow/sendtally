import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    // Node 25+ ships its own localStorage global, which hides jsdom's and has no storage
    // file to back it; turning it off leaves the test DOM's.
    poolOptions: { forks: { execArgv: ["--no-experimental-webstorage"] } },
    include: ["app/**/*.test.{ts,tsx}"],
  },
});
