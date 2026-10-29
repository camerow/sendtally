import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  changeFrom,
  type Dose,
  type SessionItem,
  type WeightUnit,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  fieldLabel,
  fieldLimits,
  fieldValue,
  stepped,
  weekFields,
  withField,
  type DoseField,
} from "@sendtally/features/training";
import { TimeField } from "../../../components/TimeField";
import { useFieldOrder } from "../../../components/useFieldOrder";
import { press } from "../../../lib/press";
import { Label } from "../components/Label";
import { NumberField } from "../components/NumberField";
import { Stepper } from "../components/Stepper";
import { type } from "../type";

export type RungEditorProps = {
  kind: WorkoutKind;
  item: SessionItem;
  change: Partial<Dose>;
  unit: WeightUnit;
  /** The week's whole change to this item, counted from the item as written. */
  onChange: (change: Partial<Dose>) => void;
};

const TIMES: readonly DoseField[] = ["onS", "offS", "setRestS"];

/** One item of one week: a typable field for each field it changes, Next walking them in order, and more fields to change. */
export function RungEditor({
  kind,
  item,
  change,
  unit,
  onChange,
}: RungEditorProps): React.ReactElement {
  const written = item.dose;
  const [shown, setShown] = React.useState(() =>
    weekFields(kind, written).filter((f) => change[f] !== undefined)
  );
  const dose: Dose = { ...written, ...change };
  const set = (target: Dose): void => onChange(changeFrom(written, target));
  const more = weekFields(kind, written).filter((f) => !shown.includes(f));
  const { slot } = useFieldOrder(shown);

  return (
    <View style={{ gap: 12 }}>
      {shown.map((f) => {
        const label = fieldLabel(kind, written, f);
        const value = fieldValue(dose, f, unit);
        const onChange = (typed: number): void => {
          const next = withField(dose, f, typed, unit);
          if (next !== null) set(next);
        };
        if (TIMES.includes(f))
          return <TimeField key={f} {...slot(f)} label={label} value={value} onChange={onChange} />;
        if (f === "edgeMm")
          return (
            <Stepper
              key={f}
              {...slot(f)}
              {...fieldLimits(f, unit)}
              value={value}
              onChange={onChange}
              onStep={(direction) => set(stepped(dose, f, direction, unit))}
              unit="mm"
              label={label}
              decreaseLabel={t("hang.decrease", { field: label })}
              increaseLabel={t("hang.increase", { field: label })}
              surface="card"
            />
          );
        return (
          <NumberField
            key={f}
            {...slot(f)}
            {...fieldLimits(f, unit)}
            label={label}
            value={value}
            onChange={onChange}
            unit={f === "weightKg" ? unit : undefined}
          />
        );
      })}
      {more.length > 0 && (
        <View style={{ gap: 8 }}>
          <Label color={colors.textSecondary}>{t("plan.alsoChange")}</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {more.map((f) => (
              <Pressable
                key={f}
                onPress={() => setShown([...shown, f])}
                accessibilityRole="button"
                style={press({
                  height: 36,
                  paddingHorizontal: 12,
                  borderRadius: 18,
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.lineOnLightStrong,
                  backgroundColor: colors.white,
                })}
              >
                <Text style={[type.bodyBold, { fontSize: 13, color: colors.gunmetal }]}>
                  {`+ ${fieldLabel(kind, written, f)}`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
