/**
 * Where a full load under /app goes: an account the server says has not had first run goes to
 * it, keeping its import page reachable as the phone does, and anyone else leaves /app/start.
 */
export function firstRunGate(path: string, firstRun: boolean | undefined): string | null {
  if (firstRun === true)
    return path === "/app/start" || path === "/app/import" ? null : "/app/start";
  return path === "/app/start" ? "/app" : null;
}

/**
 * Whether the server says first run is due. A failed or slow answer is no, so the check never
 * stands between a signed-in person and the app, as on the phone.
 */
export function firstRunDue(
  status: () => Promise<{ firstRun?: boolean }>,
  waitMs = 3000
): Promise<boolean> {
  const slow = new Promise<boolean>((resolve) => setTimeout(resolve, waitMs, false));
  return Promise.race([status().then((s) => s.firstRun === true), slow]).catch(() => false);
}

/** Whether an import page was opened from first run, which takes it back there. */
export const fromFirstRun = (search: string): boolean =>
  new URLSearchParams(search).get("then") === "/app/start";
