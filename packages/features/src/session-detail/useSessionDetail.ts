import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { JournalEntry, SendtallyApi, SessionTag } from "@sendtally/api-client";
import { stravaState, type StravaState } from "../activities/post";
import { climbsWorkedBefore } from "../climbs/transforms";
import { t } from "../i18n";
import { queries, useQuery, type QueryState } from "../query";
import { climbVMs, filterAndSortClimbs, postingStatus, sessionDetailVM } from "./transforms";
import type { ClimbFilter, ClimbSort, ClimbVM, SessionDetailVM } from "./types";

export type PostActionFeature = {
  busy: boolean;
  error: string | null;
  run: () => void;
  /** The connection read again, after Strava was connected. */
  refresh: () => Promise<void>;
};

export type SessionDetailFeature = {
  state: QueryState<{
    vm: SessionDetailVM;
    climbs: ClimbVM[];
    tags: SessionTag[];
    entries: JournalEntry[];
    /** Where it stands with Strava; null for board history never posted, or until the connection is known. */
    strava: StravaState | null;
    /** The first note on the session - what the log form's single field edits. */
    notes: string | null;
  }>;
  filter: ClimbFilter;
  setFilter: (f: ClimbFilter) => void;
  sort: ClimbSort;
  setSort: (s: ClimbSort) => void;
  post: PostActionFeature;
  reload: () => Promise<void>;
};

export function useSessionDetail(api: SendtallyApi, fingerprint: string): SessionDetailFeature {
  const [filter, setFilter] = React.useState<ClimbFilter>("all");
  const [sort, setSort] = React.useState<ClimbSort>("order");
  const [posting, setPosting] = React.useState(false);
  const [postError, setPostError] = React.useState<string | null>(null);

  const client = useQueryClient();
  const session = useQuery(queries.session(api, fingerprint));
  // Status decides whether the footer can offer a post action and the catalogue
  // tells a one-try send apart from a redpoint. The session never waits on
  // either: until they land, or if they fail, the screen renders without them.
  const statusQuery = useQuery(queries.status(api));
  const status = statusQuery.state;
  const catalogue = useQuery(queries.climbs(api)).state;
  const gyms = useQuery(queries.gyms(api)).state;

  const state = React.useMemo((): SessionDetailFeature["state"] => {
    const raw = session.state;
    if (raw.status !== "ready") return raw;
    const postable = postingStatus(status.status === "ready" ? status.data : null);
    const workedBefore =
      catalogue.status === "ready"
        ? climbsWorkedBefore(catalogue.data, raw.data.start_at)
        : new Set<string>();
    const s = raw.data;
    const gymName =
      gyms.status === "ready" ? (gyms.data.find((g) => g.id === s.gym_id)?.name ?? null) : null;
    const strava =
      s.source === "manual" || s.strava_activity_id !== null
        ? stravaState(
            {
              stravaActivityId: s.strava_activity_id === null ? null : String(s.strava_activity_id),
              postState: s.post_state,
              postError: s.post_error,
              postedAt: s.posted_at,
            },
            postable,
            posting,
            postError
          )
        : null;
    return {
      status: "ready",
      data: {
        vm: sessionDetailVM(s, postable, workedBefore, gymName),
        climbs: filterAndSortClimbs(climbVMs(raw.data.climbs, workedBefore), filter, sort),
        tags: raw.data.tags,
        entries: raw.data.entries,
        notes: raw.data.notes,
        strava,
      },
    };
  }, [session.state, status, catalogue, gyms, filter, sort, posting, postError]);

  const run = React.useCallback(() => {
    setPosting(true);
    setPostError(null);
    api
      .postSessionToStrava(fingerprint)
      .then(({ session }) => {
        client.setQueryData(queries.session(api, fingerprint).queryKey, session);
        setPosting(false);
      })
      .catch((err: unknown) => {
        setPosting(false);
        setPostError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
      });
  }, [api, client, fingerprint]);

  return {
    state,
    filter,
    setFilter,
    sort,
    setSort,
    post: { busy: posting, error: postError, run, refresh: statusQuery.reload },
    reload: session.reload,
  };
}
