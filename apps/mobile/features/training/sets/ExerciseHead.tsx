import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { TargetText } from "@sendtally/features/workouts";
import { Icon } from "../../../components/Icon";
import { press } from "../../../lib/press";
import { AboutButton, type About } from "../components/AboutButton";
import { DetailMenu } from "../components/DetailMenu";
import { IconButton } from "../components/IconButton";
import type { DetailMenuRow } from "../components/types";
import { type } from "../type";

export type ExerciseHeadProps = {
  name: string;
  /** This session's target, said once: its work, then its Target RPE on a line of its own. */
  target?: TargetText;
  /** Opens the exercise's history; no button without one. */
  onHistory?: () => void;
  /** In the run: its name folds it. */
  onFold?: () => void;
  /** The exercise's description behind an info button beside its name. */
  about?: About | undefined;
  /** In the run: its ··· menu, skip, move, remove. */
  menu?: readonly DetailMenuRow[];
};

/** An exercise block's head: the strongest text is its name, then the target it aims for. */
export function ExerciseHead({
  name,
  target,
  onHistory,
  onFold,
  about,
  menu,
}: ExerciseHeadProps): React.ReactElement {
  const lines = [target?.work, target?.rpe].filter((l) => l !== undefined && l !== "");
  return (
    <View style={{ gap: 2, paddingBottom: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 28 }}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Pressable
            onPress={onFold}
            accessibilityRole={onFold === undefined ? "header" : "button"}
            accessibilityLabel={onFold === undefined ? name : t("workouts.foldExercise", { name })}
            accessibilityState={onFold === undefined ? undefined : { expanded: true }}
            hitSlop={{ top: 12, bottom: 12 }}
            style={press({ flexShrink: 1, flexDirection: "row", alignItems: "center", gap: 6 })}
          >
            <Text style={[type.bodyBold, { flexShrink: 1, fontSize: 17, color: colors.gunmetal }]}>
              {name}
            </Text>
            {onFold !== undefined && (
              <View style={{ transform: [{ rotate: "-90deg" }] }}>
                <Icon name="chevron" size={16} strokeWidth={2} color={colors.textMuted} />
              </View>
            )}
          </Pressable>
          <AboutButton about={about} label={t("workouts.aboutExercise")} color={colors.textMuted} />
        </View>
        {onHistory !== undefined && (
          <View style={{ margin: -8, marginLeft: 0 }}>
            <IconButton
              icon="history"
              label={t("common.historyOf", { name })}
              onPress={onHistory}
              color={colors.gunmetal}
              size={40}
              iconSize={20}
            />
          </View>
        )}
        {menu !== undefined && (
          <View style={{ marginVertical: -8 }}>
            <DetailMenu
              rows={menu}
              button={{
                label: t("workouts.exerciseMore"),
                color: colors.textSecondary,
                size: 36,
                iconSize: 20,
              }}
            />
          </View>
        )}
      </View>
      {lines.map((line) => (
        <Text
          key={line}
          style={[type.monoBold, { fontSize: 14, lineHeight: 20, color: colors.gunmetal }]}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}
