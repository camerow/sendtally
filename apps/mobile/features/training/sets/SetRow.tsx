import React from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import type { SetDone, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { setChip, setText } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { holdShort } from "@sendtally/features/workouts";
import { press } from "../../../lib/press";
import { CheckBox } from "../components/CheckBox";
import { type } from "../type";
import { SET_COLUMNS } from "./setColumns";
import type { FieldSlot } from "../../../components/useFieldOrder";
import { RpeField } from "./RpeField";
import { SetDoneFields } from "./SetDoneFields";

export type SetRowProps = {
  n: number;
  target: SetDone;
  /** The top of a rep range the target runs to. */
  repsMax?: number;
  done: SetDone;
  previous: SetDone | undefined;
  lifting: boolean;
  ticked: boolean;
  current: boolean;
  unit: WeightUnit;
  label: string;
  /** ▶ in the Done cell, for the current set when it is timed. */
  go?: React.ReactNode;
  /** Where the exercise asks for a set RPE: the RPE cell's place in the card's order, and its target. */
  rpe?: { slot: FieldSlot; target: number | undefined };
  onChange: (set: SetDone) => void;
  onToggle: () => void;
};

/** One set: its number, what it asks and did last time, what was done, and its tick. */
export function SetRow({
  n,
  target,
  repsMax,
  done,
  previous,
  lifting,
  ticked,
  current,
  unit,
  label,
  go,
  rpe,
  onChange,
  onToggle,
}: SetRowProps): React.ReactElement {
  const narrow = useWindowDimensions().width < 390;
  const last =
    previous === undefined ? "" : rpe ? setChip(previous, unit) : setText(previous, unit);
  return (
    <View
      style={[
        SET_COLUMNS.row,
        {
          minHeight: 48,
          borderRadius: 10,
          backgroundColor: current ? colors.surfaceSoft : undefined,
        },
      ]}
    >
      <Text style={[type.monoBold, SET_COLUMNS.set, { fontSize: 14, color: colors.gunmetal }]}>
        {formatNumber(n)}
      </Text>
      <View style={[SET_COLUMNS.target, { gap: 2 }]}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={[type.mono, { fontSize: 14, color: colors.textSecondary }]}
        >
          {setChip(target, unit, repsMax) || "-"}
        </Text>
        {last !== "" && !((ticked || current) && narrow) && (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={[type.mono, { fontSize: 11, color: colors.textMuted }]}
          >
            {t("activities.previousSet", { set: last })}
          </Text>
        )}
      </View>
      <View style={SET_COLUMNS.done}>
        {ticked || current ? (
          <SetDoneFields
            set={done}
            lifting={lifting}
            unit={unit}
            unitless={rpe !== undefined}
            label={label}
            {...(!ticked && go !== undefined && { go })}
            holdShort={holdShort(target, done, ticked)}
            onChange={onChange}
          />
        ) : (
          <Text style={[type.monoBold, { fontSize: 14, color: colors.textMuted, paddingRight: 8 }]}>
            -
          </Text>
        )}
      </View>
      {rpe !== undefined && (
        <View style={SET_COLUMNS.rpe}>
          {ticked && (
            <RpeField
              set={done}
              target={rpe.target}
              slot={rpe.slot}
              label={label}
              onChange={onChange}
            />
          )}
        </View>
      )}
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: ticked }}
        accessibilityLabel={label}
        style={press({ width: 44, height: 44, alignItems: "flex-end", justifyContent: "center" })}
      >
        <CheckBox checked={ticked} color={colors.fern} />
      </Pressable>
    </View>
  );
}
