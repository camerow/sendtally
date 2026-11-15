/**
 * Where a full load under /app goes: an account the server says has not had first run goes to
 * it, keeping its import page reachable as the phone does, and anyone else leaves /app/start.
 */
export function firstRunGate(path: string, firstRun: boolean | undefined): string | null {
  if (firstRun === true)
    return path === "/app/start" || path === "/app/import" ? null : "/app/start";
  return path === "/app/start" ? "/app" : null;
}

/** Whether an import page was opened from first run, which takes it back there. */
export const fromFirstRun = (search: string): boolean =>
  new URLSearchParams(search).get("then") === "/app/start";
