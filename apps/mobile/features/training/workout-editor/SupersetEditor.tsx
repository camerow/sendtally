import React from "react";
import { Text, View } from "react-native";
import type { ItemGroup } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { TimeField } from "../../../components/TimeField";
import { useFieldOrder } from "../../../components/useFieldOrder";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { IconButton } from "../components/IconButton";
import { Stepper } from "../components/Stepper";
import { type } from "../type";

export type SupersetEditorProps = {
  group: ItemGroup;
  onChange: (change: Partial<Omit<ItemGroup, "id">>) => void;
  onUngroup: () => void;
  /** Absent once it holds as many members as a superset can. */
  onAdd?: () => void;
  /** Absent for the first item. */
  onMoveUp?: () => void;
  /** Absent for the last item. */
  onMoveDown?: () => void;
  /** Its members' cards. */
  children: React.ReactNode;
};

const MAX_ROUNDS = 100;

/** A superset in the editor: its rounds, its two rests, its members, + Add to superset and Ungroup. */
export function SupersetEditor({
  group,
  onChange,
  onUngroup,
  onAdd,
  onMoveUp,
  onMoveDown,
  children,
}: SupersetEditorProps): React.ReactElement {
  const { slot } = useFieldOrder(["rounds"]);
  const rounds = (n: number): number => Math.min(MAX_ROUNDS, Math.max(1, n));
  return (
    <View
      style={{
        gap: 10,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.lineOnLightStrong,
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <View style={{ minHeight: 36, flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={[type.bodyBold, { flex: 1, fontSize: 16, color: colors.gunmetal }]}>
          {t("workouts.superset")}
        </Text>
        {onMoveUp !== undefined && (
          <IconButton
            icon="moveUp"
            label={t("workouts.moveUp", { name: t("workouts.superset") })}
            onPress={onMoveUp}
            color={colors.textSecondary}
            size={36}
            iconSize={18}
          />
        )}
        {onMoveDown !== undefined && (
          <IconButton
            icon="moveDown"
            label={t("workouts.moveDown", { name: t("workouts.superset") })}
            onPress={onMoveDown}
            color={colors.textSecondary}
            size={36}
            iconSize={18}
          />
        )}
      </View>
      <View style={{ minHeight: 46, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Label color={colors.textSecondary} style={{ flex: 1 }}>
          {t("workouts.rounds")}
        </Label>
        <Stepper
          {...slot("rounds")}
          compact
          value={group.rounds}
          onChange={(n) => onChange({ rounds: rounds(n) })}
          onStep={(d) => onChange({ rounds: rounds(group.rounds + d) })}
          step={1}
          min={1}
          max={MAX_ROUNDS}
          label={t("workouts.rounds")}
          decreaseLabel={t("workouts.fewerRounds")}
          increaseLabel={t("workouts.moreRounds")}
          surface="card"
        />
      </View>
      <TimeField
        label={t("workouts.restBetweenExercises")}
        value={group.restBetweenS}
        max={3600}
        onChange={(restBetweenS) => onChange({ restBetweenS })}
      />
      <TimeField
        label={t("workouts.restBetweenRounds")}
        value={group.restRoundS}
        max={3600}
        onChange={(restRoundS) => onChange({ restRoundS })}
      />
      {children}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {onAdd !== undefined && (
          <Button
            label={t("workouts.addToSuperset")}
            onPress={onAdd}
            variant="outline"
            icon="plus"
            height={44}
          />
        )}
        <Button label={t("workouts.ungroup")} onPress={onUngroup} variant="link" height={44} />
      </View>
    </View>
  );
}
