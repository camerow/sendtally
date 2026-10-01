import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { DashedPanel } from "../../components/DashedPanel";
import { Segmented } from "../../components/Segmented";
import { TabScreen } from "../../components/TabScreen";
import { Title } from "../../components/Title";
import { useTheme } from "../../theme/ThemeContext";
import { useHangData } from "../data/HangDataContext";
import { WorkoutCard } from "./WorkoutCard";

type Source = "library" | "mine";

export function WorkoutsScreen(): React.ReactElement {
  const c = useTheme();
  const { model } = useHangData();
  const [source, setSource] = React.useState<Source>("library");
  const mine = model.workouts.filter((w) => w.source === "mine");
  const shown = model.workouts.filter((w) => w.source === source);

  return (
    <TabScreen gap={18}>
      <View
        style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}
      >
        <Title size={38} color={c.onDark}>
          {t("hang.tabWorkouts")}
        </Title>
        <Button
          label={t("hang.new")}
          onPress={() => router.push("/builder")}
          variant="accent"
          height={40}
          icon="plus"
        />
      </View>
      <Segmented<Source>
        surface="dark"
        value={source}
        onChange={setSource}
        options={[
          { value: "library", label: t("hang.library") },
          { value: "mine", label: t("hang.myWorkouts", { n: mine.length }) },
        ]}
      />
      {shown.length === 0 && <DashedPanel body={t("hang.noMine")} />}
      {shown.map((w) => (
        <WorkoutCard
          key={w.id}
          workout={w}
          onPress={() => router.push({ pathname: "/workout/[id]", params: { id: w.id } })}
        />
      ))}
    </TabScreen>
  );
}
