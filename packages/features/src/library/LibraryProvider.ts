import type React from "react";
import type { BuiltInLibrary, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type Query } from "../query";
import { setLibrary } from "./current";

/**
 * The built-in library, the same for everyone, handed to the name helpers once it has loaded.
 * A screen that cannot do without it folds this into its own load state; nothing else waits.
 */
export function useBuiltInLibrary(api: SendtallyApi): Query<BuiltInLibrary> {
  const query = useQuery(queries.library(api));
  if (query.state.status === "ready") setLibrary(query.state.data);
  return query;
}

/**
 * Starts loading the library at the app root and keeps the name helpers current. It never holds
 * the app: logging a session must not wait on the library, so screens render with whatever has
 * loaded, and the training screens show their own load or retry state until it has.
 */
export function LibraryProvider({
  api,
  children,
}: {
  api: SendtallyApi;
  children: React.ReactNode;
}): React.ReactNode {
  useBuiltInLibrary(api);
  return children;
}
