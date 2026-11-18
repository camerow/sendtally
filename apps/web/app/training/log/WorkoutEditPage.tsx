import React from "react";
import type { ActivityRecord, HangPart, HangSessionRecord } from "@sendtally/api-client";
import { draftFromActivity, useActivities } from "@sendtally/features/activities";
import { loggedPartForm } from "@sendtally/features/workouts";
import { useAppApi } from "../../lib/useAppApi";
import { useHangData } from "../data/HangDataContext";
import { ActivityForm } from "./ActivityForm";
import { HangSessionForm } from "./HangSessionForm";

type Found =
  | { kind: "activity"; record: ActivityRecord; part: HangPart | undefined }
  | { kind: "hang"; record: HangSessionRecord };

/**
 * The form for a finished workout of either kind, read once so a save or delete leaves it cleanly.
 * A mix's fingerboard part edits inline with it and saves in the same request.
 */
export function WorkoutEditPage({ id }: { id: string }): React.ReactElement | null {
  const { model } = useHangData();
  const { state } = useActivities(useAppApi());
  const activity = state.status === "ready" ? state.data.find((a) => a.id === id) : undefined;
  const hang = model.data.sessions.find((s) => s.id === id);
  const [kept, setKept] = React.useState<Found | null>(null);
  if (kept === null && activity !== undefined)
    setKept({
      kind: "activity",
      record: activity,
      part: model.data.parts.find((p) => p.activityId === id),
    });
  else if (kept === null && hang !== undefined) setKept({ kind: "hang", record: hang });
  if (kept?.kind === "hang") return <HangSessionForm session={kept.record} />;
  if (kept?.kind === "activity")
    return (
      <ActivityForm
        id={kept.record.id}
        initial={draftFromActivity(kept.record)}
        logged={activity ?? kept.record}
        {...(kept.part !== undefined && {
          part: loggedPartForm(kept.part),
          gripName: model.gripName,
        })}
      />
    );
  return null;
}
