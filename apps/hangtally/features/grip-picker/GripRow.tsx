import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { IconButton } from "../../components/IconButton";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";

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
  const c = useTheme();
  return (
    <View
      style={{
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        paddingRight: onEdit === undefined ? 0 : 6,
        borderRadius: 14,
        borderWidth: on ? 2 : 1,
        borderColor: on ? c.ink : c.lineLight,
        backgroundColor: on ? c.soft : undefined,
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole={multi ? "checkbox" : "radio"}
        accessibilityState={multi ? { checked: on } : { selected: on }}
        style={{
          flex: 1,
          minHeight: 62,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingVertical: 10,
          paddingHorizontal: 14,
        }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: multi ? 8 : 13,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: on ? c.ink : undefined,
            borderWidth: on ? 0 : 2,
            borderColor: c.lineLight,
          }}
        >
          {on && <Icon name="check" color={c.card} size={16} strokeWidth={3} />}
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[type.bodyBold, { fontSize: 17, color: c.ink }]}>{name}</Text>
          <Label small color={c.ink2}>
            {meta}
          </Label>
        </View>
        {load !== "" && <Text style={[type.monoBold, { fontSize: 15, color: c.ink }]}>{load}</Text>}
      </Pressable>
      {onEdit !== undefined && (
        <IconButton
          icon="edit"
          label={t("hang.editGripAria", { grip: name })}
          onPress={onEdit}
          color={c.ink2}
          size={44}
          iconSize={18}
        />
      )}
    </View>
  );
}
