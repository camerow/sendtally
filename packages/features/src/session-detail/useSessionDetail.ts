import React from "react";
import type { SendtallyApi, SessionDetail, SessionTag } from "@sendtally/api-client";
import { useQuery, type QueryState } from "../lib/useQuery";
import { climbVMs, filterAndSortClimbs, postingStatus, sessionDetailVM } from "./transforms";
import type { ClimbFilter, ClimbSort, ClimbVM, PostingStatus, SessionDetailVM } from "./types";

export type PostActionFeature = {
  busy: boolean;
  error: string | null;
  run: () => void;
};

export type SessionDetailFeature = {
  state: QueryState<{ vm: SessionDetailVM; climbs: ClimbVM[]; tags: SessionTag[] }>;
  filter: ClimbFilter;
  setFilter: (f: ClimbFilter) => void;
  sort: ClimbSort;
  setSort: (s: ClimbSort) => void;
  post: PostActionFeature;
  reload: () => void;
};

type Loaded = { session: SessionDetail; posting: PostingStatus | null };

export function useSessionDetail(api: SendtallyApi, fingerprint: string): SessionDetailFeature {
  const [filter, setFilter] = React.useState<ClimbFilter>("all");
  const [sort, setSort] = React.useState<ClimbSort>("order");
  const [posting, setPosting] = React.useState(false);
  const [postError, setPostError] = React.useState<string | null>(null);

  const load = React.useCallback(async (): Promise<Loaded> => {
    // The status call decides whether the footer can offer a post action, so a
    // failure there degrades to "no action" rather than failing the whole screen.
    const [{ session }, status] = await Promise.all([
      api.session(fingerprint),
      api.status().catch(() => null),
    ]);
    return { session, posting: postingStatus(status) };
  }, [api, fingerprint]);

  const { state: raw, reload } = useQuery(load);

  const state = React.useMemo((): SessionDetailFeature["state"] => {
    if (raw.status !== "ready") return raw;
    const all = climbVMs(raw.data.session.climbs);
    return {
      status: "ready",
      data: {
        vm: sessionDetailVM(raw.data.session, raw.data.posting),
        climbs: filterAndSortClimbs(all, filter, sort),
        tags: raw.data.session.tags,
      },
    };
  }, [raw, filter, sort]);

  const run = React.useCallback(() => {
    setPosting(true);
    setPostError(null);
    api
      .postSessionToStrava(fingerprint)
      .then(() => {
        setPosting(false);
        reload();
      })
      .catch((err: unknown) => {
        setPosting(false);
        setPostError(err instanceof Error ? err.message : "Something went wrong.");
      });
  }, [api, fingerprint, reload]);

  return {
    state,
    filter,
    setFilter,
    sort,
    setSort,
    post: { busy: posting, error: postError, run },
    reload,
  };
}
