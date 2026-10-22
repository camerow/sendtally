import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { loadKey, type Workout } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../../components/Icon";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { Stepper } from "../components/Stepper";
import { UnitSwitch } from "../components/UnitSwitch";
import { useHangData } from "../data/HangDataContext";
import { loadControl } from "../loads/loadControl";
import { type } from "../type";

export type GripLoadCardProps = { workout: Workout; gripId: string; onChooseGrip: () => void };

/** The chosen grip, and this workout's load on it. */
export function GripLoadCard({
  workout,
  gripId,
  onChooseGrip,
}: GripLoadCardProps): React.ReactElement {
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
    <View style={{ borderRadius: 16, overflow: "hidden", backgroundColor: colors.surfaceSoft }}>
      <Pressable
        onPress={onChooseGrip}
        accessibilityRole="button"
        style={pressRow({
          minHeight: 64,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
        })}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Label small color={colors.textSecondary}>
            {t("hang.gripTapToChange")}
          </Label>
          <Text style={[type.bodyBold, { fontSize: 17, color: colors.gunmetal }]}>{grip}</Text>
        </View>
        <Icon name="chevron" color={colors.gunmetal} size={18} strokeWidth={2} />
      </Pressable>
      <View style={{ height: 1, marginHorizontal: 16, backgroundColor: colors.lineOnLight }} />
      <View style={{ gap: 10, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Label small color={colors.textSecondary}>
            {title}
          </Label>
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
        <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: colors.textSecondary }]}>
          {workout.kind === "hang"
            ? t("hang.hangLoadNote", { load: load.label })
            : t("hang.pullLoadNote", { load: load.label })}
        </Text>
      </View>
    </View>
  );
}
