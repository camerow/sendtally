import React from "react";
import { Pressable, Text, View } from "react-native";
import { loadKey, type Workout } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { Label } from "../../components/Label";
import { Stepper } from "../../components/Stepper";
import { Title } from "../../components/Title";
import { UnitSwitch } from "../../components/UnitSwitch";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { loadControl } from "../loads/loadControl";

export type GripLoadCardProps = { workout: Workout; gripId: string; onChooseGrip: () => void };

/** The chosen grip, and this workout's load on it. */
export function GripLoadCard({
  workout,
  gripId,
  onChooseGrip,
}: GripLoadCardProps): React.ReactElement {
  const c = useTheme();
  const { model, actions } = useHangData();
  const grip = model.gripName(gripId);
  const load = loadControl(
    workout.kind,
    model.load(workout, gripId),
    model.settings.units,
    (kg) => void actions.setLoads({ [loadKey(workout.id, gripId)]: kg })
  );
  const title =
    workout.kind === "hang" ? t("hang.addedLoadFor", { grip }) : t("hang.weightFor", { grip });

  return (
    <View style={{ borderRadius: 20, overflow: "hidden", backgroundColor: c.card }}>
      <Pressable
        onPress={onChooseGrip}
        accessibilityRole="button"
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingTop: 18,
          paddingHorizontal: 18,
          paddingBottom: 16,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Label color={c.ink2}>{t("hang.gripTapToChange")}</Label>
          <Title size={32} color={c.ink}>
            {grip}
          </Title>
        </View>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.ink,
          }}
        >
          <Icon name="down" color={c.card} size={22} strokeWidth={2.4} />
        </View>
      </Pressable>
      <View
        style={{
          gap: 10,
          paddingTop: 12,
          paddingHorizontal: 18,
          paddingBottom: 16,
          borderTopWidth: 1,
          borderTopColor: c.lineLight,
          backgroundColor: c.soft,
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Label color={c.ink2}>{title}</Label>
          <UnitSwitch />
        </View>
        <Stepper
          value={load.text}
          onCommit={load.commit}
          onStep={load.step}
          label={title}
          decreaseLabel={t("hang.lessWeight")}
          increaseLabel={t("hang.moreWeight")}
          surface="card"
          buttonSize={48}
          fontSize={22}
          keyboard="numbers-and-punctuation"
        />
        <Text style={[type.body, { fontSize: 13, color: c.ink2 }]}>
          {workout.kind === "hang"
            ? t("hang.hangLoadNote", { load: load.label })
            : t("hang.pullLoadNote", { load: load.label })}
        </Text>
      </View>
    </View>
  );
}
