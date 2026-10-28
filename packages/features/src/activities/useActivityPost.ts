import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type {
  ActivityRecord,
  HangData,
  HangSessionRecord,
  SendtallyApi,
} from "@sendtally/api-client";
import { t } from "../i18n";
import { queries, useQuery } from "../query";
import { postingStatus } from "../session-detail/transforms";
import { stravaState, type StravaState } from "./post";

/** A finished workout of either store: an activity, or a hangboard session. */
export type PostTarget =
  { kind: "activity"; record: ActivityRecord } | { kind: "hang"; record: HangSessionRecord };

export type ActivityPostFeature = {
  state: StravaState | null;
  /** Posts now, whatever the training posting setting says. */
  run: () => void;
  /** The status query read again, after Strava was connected. */
  refresh: () => Promise<void>;
};

const replace = <T extends { id: string }>(list: readonly T[], item: T): T[] =>
  list.map((x) => (x.id === item.id ? item : x));

/** A finished workout's Strava state, and posting it on request. */
export function useActivityPost(api: SendtallyApi, target: PostTarget): ActivityPostFeature {
  const client = useQueryClient();
  const status = useQuery(queries.status(api));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { kind, record } = target;
  const id = record.id;

  const run = React.useCallback(() => {
    setBusy(true);
    setError(null);
    const request =
      kind === "activity"
        ? api.postActivityToStrava(id).then(({ activity }) => {
            client.setQueryData<ActivityRecord[]>(queries.activities(api).queryKey, (list) =>
              list === undefined ? list : replace(list, activity)
            );
          })
        : api.postHangSession(id).then(({ session }) => {
            client.setQueryData<HangData>(queries.hang(api).queryKey, (data) =>
              data === undefined ? data : { ...data, sessions: replace(data.sessions, session) }
            );
          });
    request
      .then(() => {
        setBusy(false);
        void client.invalidateQueries({ queryKey: queries.sessions(api).queryKey });
      })
      .catch((err: unknown) => {
        setBusy(false);
        setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
      });
  }, [api, client, id, kind]);

  const posting = postingStatus(status.state.status === "ready" ? status.state.data : null);
  return { state: stravaState(record, posting, busy, error), run, refresh: status.reload };
}
