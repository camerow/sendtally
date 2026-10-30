import type { ActivityPostState } from "@sendtally/api-client";
import type { PostingStatus } from "../session-detail/types";

/** What a finished workout carries about Strava; a hang session has no posting time. */
export type PostFields = {
  stravaActivityId: string | null;
  postState: ActivityPostState | null;
  postError: string | null;
  postedAt?: string | null;
};

/** Where a finished workout stands with Strava, which decides its menu row and status row. */
export type StravaState =
  | { kind: "connect" }
  | { kind: "post" }
  | { kind: "posting" }
  | { kind: "posted"; url: string; postedAt: string | null }
  | { kind: "failed"; reason: string | null };

/**
 * Posted wins, then a post in flight. Without a live connection the way forward is to
 * connect; a failure offers another go; null until the connection is known.
 */
export function stravaState(
  record: PostFields,
  posting: PostingStatus | null,
  busy: boolean,
  error: string | null
): StravaState | null {
  if (record.stravaActivityId !== null) {
    return {
      kind: "posted",
      url: `https://www.strava.com/activities/${record.stravaActivityId}`,
      postedAt: record.postedAt ?? null,
    };
  }
  if (busy || record.postState === "pending") return { kind: "posting" };
  if (posting !== null && !(posting.connected && posting.active)) return { kind: "connect" };
  if (error !== null || record.postState === "failed") {
    return { kind: "failed", reason: error ?? record.postError };
  }
  return posting === null ? null : { kind: "post" };
}
