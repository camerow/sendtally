import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { ActivityRecord, SendtallyApi } from "@sendtally/api-client";
import { t } from "../i18n";
import { queries, useQuery } from "../query";
import { postingStatus } from "../session-detail/transforms";
import type { PostActionFeature } from "../session-detail/useSessionDetail";
import type { PostStatusVM } from "../session-detail/types";
import { activityPostVM } from "./post";

export type ActivityPostFeature = { vm: PostStatusVM; action: PostActionFeature };

/** An activity's Strava status, and posting it on request whatever the training posting setting. */
export function useActivityPost(api: SendtallyApi, activity: ActivityRecord): ActivityPostFeature {
  const client = useQueryClient();
  const status = useQuery(queries.status(api)).state;
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const id = activity.id;

  const run = React.useCallback(() => {
    setBusy(true);
    setError(null);
    api
      .postActivityToStrava(id)
      .then(({ activity: saved }) => {
        client.setQueryData<ActivityRecord[]>(queries.activities(api).queryKey, (list) =>
          list?.map((a) => (a.id === saved.id ? saved : a))
        );
        setBusy(false);
      })
      .catch((err: unknown) => {
        setBusy(false);
        setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
      });
  }, [api, client, id]);

  const posting = postingStatus(status.status === "ready" ? status.data : null);
  return { vm: activityPostVM(activity, posting), action: { busy, error, run } };
}
