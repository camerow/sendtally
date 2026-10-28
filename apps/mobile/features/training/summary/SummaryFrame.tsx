import { router } from "expo-router";
import React from "react";
import { Linking, View } from "react-native";
import type { Focus } from "@sendtally/core/hang";
import { useActivityPost, type PostTarget } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { useApi } from "../../../lib/api";
import { useStravaConnect } from "../../settings/useStravaConnect";
import { DetailActions } from "../components/DetailActions";
import { deleteRow } from "../components/deleteRow";
import { FocusTag } from "../components/FocusTag";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import type { Stat } from "../components/types";
import { StravaStatusRow } from "./StravaStatusRow";
import { stravaRow } from "./stravaRow";
import { SummaryTiles } from "./SummaryTiles";

export type SummaryFrameProps = {
  kicker: string;
  kickerColor: string;
  title: string;
  /** What the session recorded it trained for. */
  focus: Focus | null;
  tiles: readonly Stat[];
  target: PostTarget;
  rpe: number | null;
  onDelete: () => void;
  children: React.ReactNode;
};

/** What every finished workout shares: Back, Edit and the menu, its kicker, title and focus, its tiles and Strava. */
export function SummaryFrame({
  kicker,
  kickerColor,
  title,
  focus,
  tiles,
  target,
  rpe,
  onDelete,
  children,
}: SummaryFrameProps): React.ReactElement {
  const api = useApi();
  const post = useActivityPost(api, target);
  const { run, refresh } = post;
  const connected = React.useCallback(() => {
    void refresh();
    run();
  }, [refresh, run]);
  const strava = useStravaConnect(api, connected);
  const id = target.record.id;

  const onStrava = (): void => {
    const state = post.state;
    if (state?.kind === "posted") void Linking.openURL(state.url);
    else if (state?.kind === "connect") strava.connect();
    else post.run();
  };
  const remove = deleteRow({
    title: t("summary.deleteWorkout"),
    hint: post.state?.kind === "posted" ? t("summary.deleteHintStrava") : t("summary.deleteHint"),
    confirm: { title: t("workouts.deleteTitle", { name: title }) },
    onDelete,
  });

  return (
    <ScreenFrame
      action={
        <DetailActions
          onEdit={() => router.push({ pathname: "/activity/[id]/edit", params: { id } })}
          menu={post.state === null ? [remove] : [stravaRow(post.state, rpe, onStrava), remove]}
        />
      }
    >
      <View style={{ gap: 6 }}>
        <Label color={kickerColor}>{kicker}</Label>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Title size={32} style={{ flex: 1 }}>
            {title}
          </Title>
          <FocusTag focus={focus} />
        </View>
      </View>
      <SummaryTiles stats={tiles} />
      {post.state !== null && <StravaStatusRow state={post.state} />}
      {children}
    </ScreenFrame>
  );
}
