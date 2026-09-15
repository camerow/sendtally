import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

// Prebundled together so both entries share one @clerk/shared context; optimized apart, the
// experimental billing hooks see a second ClerkProvider context and throw in dev.
const clerkEntries = ["@clerk/react-router", "@clerk/react/experimental"];

export default defineConfig({
  plugins: [cloudflare({ viteEnvironment: { name: "ssr" } }), reactRouter()],
  optimizeDeps: { include: clerkEntries },
  environments: { ssr: { optimizeDeps: { include: clerkEntries } } },
});
