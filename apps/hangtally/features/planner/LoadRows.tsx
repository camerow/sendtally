import React from "react";
import { Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Label } from "../../components/Label";
import { SheetSection } from "../../components/SheetSection";
import { Stepper } from "../../components/Stepper";
import { UnitSwitch } from "../../components/UnitSwitch";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { loadControl } from "../loads/loadControl";
import type { Planner } from "./usePlanner";

/** One load per chosen grip, saved onto the workout's per-grip loads. */
export function LoadRows({ planner }: { planner: Planner }): React.ReactElement | null {
  const c = useTheme();
  const { model } = useHangData();
  const { workout, draft } = planner;
  if (workout === undefined || draft.grips.length === 0) return null;
  const unit = model.settings.units;
  return (
    <SheetSection
      label={workout.kind === "pull" ? t("hang.weightPerGrip") : t("hang.loadPerGrip")}
      aside={<UnitSwitch />}
      gap={4}
    >
      {draft.grips.map((gripId) => {
        const grip = model.gripName(gripId);
        const load = loadControl(workout.kind, planner.loadFor(gripId), unit, (kg) =>
          planner.setLoad(gripId, kg)
        );
        return (
          <View
            key={gripId}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingVertical: 6,
              borderBottomWidth: 1,
              borderBottomColor: c.lineLight,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.bodyBold, { fontSize: 15, color: c.ink }]}>{grip}</Text>
              <Label small color={c.ink2}>
                {load.label}
              </Label>
            </View>
            <Stepper
              value={load.text}
              onCommit={load.commit}
              onStep={load.step}
              label={t("hang.loadOnGrip", { grip, unit })}
              decreaseLabel={t("hang.lessOnGrip", { grip })}
              increaseLabel={t("hang.moreOnGrip", { grip })}
              surface="light"
              inputWidth={72}
              keyboard="numbers-and-punctuation"
              inSheet
            />
          </View>
        );
      })}
    </SheetSection>
  );
}
