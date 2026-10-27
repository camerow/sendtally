import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { HangIcon } from "../components/HangIcon";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { type } from "../type";

export type GripRowProps = {
  name: string;
  meta: string;
  load: string;
  on: boolean;
  multi: boolean;
  onPress: () => void;
  /** Only the user's own grips can be renamed or deleted. */
  onEdit?: () => void;
};

/**
 * A grip with its history for this workout: square checkboxes when several can
 * be picked, radios otherwise. The edit button sits beside the row, not inside
 * it, so a screen reader reaches both.
 */
export function GripRow({
  name,
  meta,
  load,
  on,
  multi,
  onPress,
  onEdit,
}: GripRowProps): React.ReactElement {
  return (
    <View
      style={{
        minHeight: 60,
        flexDirection: "row",
        alignItems: "center",
        paddingRight: onEdit === undefined ? 0 : 4,
        borderRadius: 12,
        borderWidth: on ? 0 : 1,
        borderColor: colors.lineOnLight,
        backgroundColor: on ? colors.surfaceSoft : undefined,
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole={multi ? "checkbox" : "radio"}
        accessibilityState={multi ? { checked: on } : { selected: on }}
        style={{
          flex: 1,
          minHeight: 60,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 8,
          paddingHorizontal: 14,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: multi ? 6 : 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: on && multi ? colors.gunmetal : undefined,
            borderWidth: on && multi ? 0 : 2,
            borderColor: colors.gunmetal,
          }}
        >
          {on && multi && <HangIcon name="check" color={colors.white} size={14} strokeWidth={3} />}
          {on && !multi && (
            <View
              style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gunmetal }}
            />
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{name}</Text>
          {meta !== "" && (
            <Label small color={colors.textSecondary}>
              {meta}
            </Label>
          )}
        </View>
        {load !== "" && (
          <Text style={[type.monoBold, { fontSize: 14, color: colors.gunmetal }]}>{load}</Text>
        )}
      </Pressable>
      {onEdit !== undefined && (
        <IconButton
          icon="edit"
          label={t("hang.editGripAria", { grip: name })}
          onPress={onEdit}
          color={colors.textSecondary}
          iconSize={18}
        />
      )}
    </View>
  );
}
