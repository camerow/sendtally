import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { pressRow } from "../../lib/press";

export type ClimbListRowProps = {
  gradeLabel: string;
  name: string;
  meta: string;
  chevron?: boolean;
  onPress: () => void;
};

export function ClimbListRow({
  gradeLabel,
  name,
  meta,
  chevron = true,
  onPress,
}: ClimbListRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[gradeLabel, name, meta].filter((p) => p !== "").join(", ")}
      style={pressRow({
        minHeight: 54,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <Text
        style={{ width: 40, fontFamily: fonts.monoSemiBold, fontSize: 15, color: colors.gunmetal }}
      >
        {gradeLabel}
      </Text>
      <View style={{ flex: 1, gap: 2, paddingVertical: 8 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}
        >
          {name}
        </Text>
        {meta !== "" && (
          <Text
            numberOfLines={1}
            style={{ fontFamily: fonts.mono, fontSize: 11.5, color: colors.textSecondary }}
          >
            {meta}
          </Text>
        )}
      </View>
      {chevron && <Icon name="chevron" size={16} strokeWidth={2} color={colors.gunmetal} />}
    </Pressable>
  );
}
