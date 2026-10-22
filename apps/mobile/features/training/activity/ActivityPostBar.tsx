import React from "react";
import type { ActivityRecord } from "@sendtally/api-client";
import { useActivityPost } from "@sendtally/features/activities";
import { useApi } from "../../../lib/api";
import { PostStatusBar } from "../../sessions/PostStatusBar";

export type ActivityPostBarProps = {
  activity: ActivityRecord;
};

/** Where a logged activity stands with Strava, with a post or retry when one is possible. */
export function ActivityPostBar({ activity }: ActivityPostBarProps): React.ReactElement {
  const { vm, action } = useActivityPost(useApi(), activity);
  return <PostStatusBar post={vm} action={action} />;
}
