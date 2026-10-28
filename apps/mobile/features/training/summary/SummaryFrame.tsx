import { router } from "expo-router";
import React from "react";
import { Linking, ScrollView, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { useActivityPost, type PostTarget } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { BackButton } from "../../../components/BackButton";
import { useApi } from "../../../lib/api";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { useStravaConnect } from "../../settings/useStravaConnect";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import type { Stat } from "../components/types";
import { StravaStatusRow } from "./StravaStatusRow";
import { SummaryTiles } from "./SummaryTiles";
import { WorkoutMenu } from "./WorkoutMenu";

export type SummaryFrameProps = {
  kicker: string;
  kickerColor: string;
  title: string;
  tiles: readonly Stat[];
  target: PostTarget;
  rpe: number | null;
  onDelete: () => void;
  children: React.ReactNode;
};

/** What every finished workout shares: Back, Edit and the menu, its kicker and title, its tiles and Strava. */
export function SummaryFrame({
  kicker,
  kickerColor,
  title,
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
  const [menu, setMenu] = React.useState(false);
  const id = target.record.id;

  const onStrava = (): void => {
    const state = post.state;
    if (state?.kind === "posted") void Linking.openURL(state.url);
    else if (state?.kind === "connect") {
      setMenu(false);
      strava.connect();
    } else post.run();
  };
  const remove = (): void => {
    setMenu(false);
    confirmDestructive({
      title: t("workouts.deleteTitle", { name: title }),
      action: t("common.delete"),
      onConfirm: () => {
        onDelete();
        router.back();
      },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 18,
          paddingTop: 6,
        }}
      >
        <BackButton />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Button
            label={t("common.edit")}
            variant="outline"
            height={40}
            onPress={() => router.push({ pathname: "/activity/[id]/edit", params: { id } })}
          />
          <IconButton
            icon="more"
            label={t("summary.more")}
            onPress={() => setMenu(true)}
            color={colors.gunmetal}
            iconSize={22}
          />
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{ gap: 12, paddingTop: 6, paddingHorizontal: 18, paddingBottom: 32 }}
      >
        <Label color={kickerColor}>{kicker}</Label>
        <Title size={32}>{title}</Title>
        <SummaryTiles stats={tiles} />
        {post.state !== null && <StravaStatusRow state={post.state} />}
        {children}
      </ScrollView>
      <WorkoutMenu
        visible={menu}
        onClose={() => setMenu(false)}
        strava={post.state}
        rpe={rpe}
        onStrava={onStrava}
        onDelete={remove}
      />
    </View>
  );
}
