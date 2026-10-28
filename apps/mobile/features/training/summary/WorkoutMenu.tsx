import React from "react";
import { View } from "react-native";
import type { StravaState } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../../components/Sheet";
import { MenuRow, type MenuRowProps } from "../../live-session/MenuRow";
import { Button } from "../components/Button";

export type WorkoutMenuProps = {
  visible: boolean;
  onClose: () => void;
  strava: StravaState | null;
  rpe: number | null;
  /** Connect, post, retry or view, as the state says. */
  onStrava: () => void;
  onDelete: () => void;
};

type StravaRow = Pick<MenuRowProps, "title" | "hint" | "busy">;

function stravaRow(state: StravaState, rpe: number | null): StravaRow {
  const postHint =
    rpe === null ? t("summary.postHintNoEffort") : t("summary.postHint", { rpe: String(rpe) });
  switch (state.kind) {
    case "connect":
      return { title: t("summary.connectStrava"), hint: t("summary.connectHint") };
    case "post":
      return { title: t("sessionDetail.postToStrava"), hint: postHint };
    case "posting":
      return { title: t("summary.posting"), hint: postHint, busy: true };
    case "posted":
      return { title: t("summary.viewOnStrava"), hint: t("summary.viewHint") };
    case "failed":
      return { title: t("summary.tryAgain"), hint: state.reason ?? t("summary.tryAgainHint") };
  }
}

/** A finished workout's rarer actions: its Strava row, and Delete. */
export function WorkoutMenu({
  visible,
  onClose,
  strava,
  rpe,
  onStrava,
  onDelete,
}: WorkoutMenuProps): React.ReactElement {
  const row = strava === null ? null : stravaRow(strava, rpe);
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 4, paddingTop: 4, paddingHorizontal: 12 }}>
        {row !== null && <MenuRow icon="strava" {...row} onPress={onStrava} />}
        <MenuRow
          icon="trash"
          title={t("summary.deleteWorkout")}
          hint={strava?.kind === "posted" ? t("summary.deleteHintStrava") : t("summary.deleteHint")}
          onPress={onDelete}
          danger
        />
        <Button
          label={t("common.cancel")}
          onPress={onClose}
          variant="outline"
          height={52}
          style={{ marginTop: 6 }}
        />
      </View>
    </Sheet>
  );
}
