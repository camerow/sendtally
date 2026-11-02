import React from "react";
import { Pressable, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SetDone, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { setSeconds, setText } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import type { FieldSlot } from "../../../components/useFieldOrder";
import { press } from "../../../lib/press";
import { CheckBox } from "../components/CheckBox";
import { SET_COLUMNS } from "../sets/setColumns";
import { SetDoneFields } from "../sets/SetDoneFields";
import { type } from "../type";

export type ReviewSetRowProps = {
  n: number;
  /** What the set asked; none when it was not planned. */
  target: SetDone | undefined;
  done: SetDone;
  /** A hangboard set: hangs typed, hang time read. */
  hangs: boolean;
  lifting: boolean;
  unit: WeightUnit;
  /** Ticked, it counts; off, it does not save, though its fields stay live and typing ticks it. */
  on: boolean;
  /** "4 of 6 hangs" when it fell short of its target. */
  short: string | null;
  label: string;
  /** A hang count's place in its column, so Next walks to the next set. */
  slot?: FieldSlot;
  /** A hang set's load, after its count. */
  loadSlot?: FieldSlot;
  /** The load a hang set shows while it has none of its own. */
  defaultLoadKg?: number;
  onChange: (set: SetDone) => void;
  onToggle: () => void;
  onRemove: () => void;
};

/** A hang target reads "6 × 7s"; anything else as its set reads. */
const targetText = (target: SetDone, hangs: boolean, unit: WeightUnit): string =>
  hangs && target.reps !== undefined && target.onS !== undefined
    ? `${formatNumber(target.reps)} × ${setSeconds(target.onS)}`
    : setText(target, unit);

/** One set to review: what it asked, what was done, and its tick. Swipe it away to remove it. */
export function ReviewSetRow({
  n,
  target,
  done,
  hangs,
  lifting,
  unit,
  on,
  short,
  label,
  slot,
  loadSlot,
  defaultLoadKg,
  onChange,
  onToggle,
  onRemove,
}: ReviewSetRowProps): React.ReactElement {
  const remove = t("activities.removeSet", { n });
  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      renderRightActions={() => (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={remove}
          style={press({
            width: 88,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            backgroundColor: colors.watermelonInk,
          })}
        >
          <Text style={[type.bodyBold, { fontSize: 14, color: colors.white }]}>
            {t("plan.removeAction")}
          </Text>
        </Pressable>
      )}
    >
      <View
        testID="review-set"
        accessibilityActions={[{ name: "remove", label: remove }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === "remove") onRemove();
        }}
        style={[SET_COLUMNS.row, { minHeight: 48, backgroundColor: colors.white }]}
      >
        <Text
          style={[
            type.monoBold,
            SET_COLUMNS.set,
            { fontSize: 14, color: on ? colors.gunmetal : colors.textMuted },
          ]}
        >
          {formatNumber(n)}
        </Text>
        <View style={[SET_COLUMNS.target, { gap: 2 }]}>
          <Text
            style={[
              type.mono,
              { fontSize: 14, color: on ? colors.textSecondary : colors.textMuted },
            ]}
          >
            {target === undefined ? "-" : targetText(target, hangs, unit) || "-"}
          </Text>
          {on && short !== null && (
            <Text style={[type.mono, { fontSize: 11, color: "#C27C0E" }]}>{short}</Text>
          )}
        </View>
        <View style={SET_COLUMNS.done}>
          {done.climbs === undefined ? (
            <SetDoneFields
              set={done}
              lifting={lifting}
              hangs={hangs}
              short={on && short !== null}
              unit={unit}
              label={label}
              slot={slot}
              loadSlot={loadSlot}
              defaultLoadKg={defaultLoadKg}
              onChange={onChange}
            />
          ) : (
            <Text
              style={[type.monoBold, { fontSize: 14, color: colors.textMuted, paddingRight: 8 }]}
            >
              {setText(done, unit)}
            </Text>
          )}
        </View>
        <Pressable
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: on }}
          accessibilityLabel={label}
          style={press({ width: 44, height: 44, alignItems: "center", justifyContent: "center" })}
        >
          <CheckBox checked={on} color={colors.fern} />
        </Pressable>
      </View>
    </ReanimatedSwipeable>
  );
}
