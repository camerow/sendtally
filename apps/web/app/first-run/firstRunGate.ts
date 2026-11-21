/**
 * Where a full load under /app goes: an account the server says has not had first run goes to
 * it, keeping its import page reachable as the phone does, and anyone else leaves /app/start
 * unless it was opened onto a path, as the setup cards and Account do.
 */
export function firstRunGate(url: URL, firstRun: boolean | undefined): string | null {
  const path = url.pathname;
  if (firstRun === true)
    return path === "/app/start" || path === "/app/import" ? null : "/app/start";
  return path === "/app/start" && !url.searchParams.has("path") ? "/app" : null;
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
