import React from "react";
import { Pressable, Text, View } from "react-native";
import { Icon } from "../../components/Icon";
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
};

/** A grip with its history for this workout: square checkboxes when several can be picked, radios otherwise. */
export function GripRow({
  name,
  meta,
  load,
  on,
  multi,
  onPress,
}: GripRowProps): React.ReactElement {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multi ? "checkbox" : "radio"}
      accessibilityState={multi ? { checked: on } : { selected: on }}
      style={{
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: on ? 2 : 1,
        borderColor: on ? c.ink : c.lineLight,
        backgroundColor: on ? c.soft : undefined,
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
  );
}
