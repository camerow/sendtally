import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { JournalEntry, SendtallyApi, SessionTag } from "@sendtally/api-client";
import { climbsWorkedBefore } from "../climbs/transforms";
import { t } from "../i18n";
import { queries, useQuery, type QueryState } from "../query";
import { climbVMs, filterAndSortClimbs, postingStatus, sessionDetailVM } from "./transforms";
import type { ClimbFilter, ClimbSort, ClimbVM, SessionDetailVM } from "./types";

export type PostActionFeature = {
  busy: boolean;
  error: string | null;
  run: () => void;
};

export type SessionDetailFeature = {
  state: QueryState<{
    vm: SessionDetailVM;
    climbs: ClimbVM[];
    tags: SessionTag[];
    entries: JournalEntry[];
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
  const status = useQuery(queries.status(api)).state;
  const catalogue = useQuery(queries.climbs(api)).state;

  const state = React.useMemo((): SessionDetailFeature["state"] => {
    const raw = session.state;
    if (raw.status !== "ready") return raw;
    const postable = postingStatus(status.status === "ready" ? status.data : null);
    const workedBefore =
      catalogue.status === "ready"
        ? climbsWorkedBefore(catalogue.data, raw.data.start_at)
        : new Set<string>();
    return {
      status: "ready",
      data: {
        vm: sessionDetailVM(raw.data, postable, workedBefore),
        climbs: filterAndSortClimbs(climbVMs(raw.data.climbs, workedBefore), filter, sort),
        tags: raw.data.tags,
        entries: raw.data.entries,
        notes: raw.data.notes,
      },
    };
  }, [session.state, status, catalogue, filter, sort]);

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
    post: { busy: posting, error: postError, run },
    reload: session.reload,
  };
}
