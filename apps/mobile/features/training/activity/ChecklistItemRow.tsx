import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press, pressRow } from "../../../lib/press";
import { CheckBox } from "../components/CheckBox";
import { type } from "../type";

export type ChecklistItemRowProps = {
  name: string;
  /** Its hold, "2 × 60s"; empty when it only ticks off. */
  dose: string;
  ticked: boolean;
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
};

const TICK = { width: 44, height: 48, alignItems: "center", justifyContent: "center" } as const;

/** One item of a checklist done: the row ticks it, or with a hold opens it to fix the seconds. */
export function ChecklistItemRow({
  name,
  dose,
  ticked,
  open,
  onToggle,
  onOpen,
}: ChecklistItemRowProps): React.ReactElement {
  const hold = dose !== "";
  const tick = <CheckBox checked={ticked} color={colors.fern} />;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: open ? 0 : 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <Pressable
        onPress={hold ? onOpen : onToggle}
        accessibilityRole={hold ? "button" : "checkbox"}
        accessibilityState={hold ? { expanded: open } : { checked: ticked }}
        accessibilityLabel={hold ? t("activities.editSets", { exercise: name }) : name}
        style={pressRow({ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 })}
      >
        <Text
          style={[
            type.body,
            { flex: 1, fontSize: 15, color: ticked ? colors.gunmetal : colors.textMuted },
          ]}
        >
          {name}
        </Text>
        {open ? (
          <Text style={[type.bodyBold, { fontSize: 14, color: colors.azureInk }]}>
            {t("common.done")}
          </Text>
        ) : (
          <Text style={[type.mono, { fontSize: 12, color: colors.textMuted }]}>{dose}</Text>
        )}
        {!hold && <View style={TICK}>{tick}</View>}
      </Pressable>
      {hold && (
        <Pressable
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: ticked }}
          accessibilityLabel={name}
          style={press(TICK)}
        >
          {tick}
        </Pressable>
      )}
    </View>
  );
}
