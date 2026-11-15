import type React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type QueryState } from "../query";
import { setLibrary } from "./current";

/**
 * Loads the built-in library, the same for everyone, and holds the screens below until it has:
 * they name built-ins as they render. A load that fails shows `fallback` with its retry. A later
 * change reaches each screen the next time it renders.
 */
export function LibraryProvider({
  api,
  fallback,
  children,
}: {
  api: SendtallyApi;
  fallback: (state: QueryState<unknown>, retry: () => void) => React.ReactNode;
  children: React.ReactNode;
}): React.ReactNode {
  const { state, reload } = useQuery(queries.library(api));
  if (state.status !== "ready") return fallback(state, () => void reload());
  setLibrary(state.data);
  return children;
}
