import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { press } from "../lib/press";

export type SelectRowProps = {
  label: string;
  value: string;
  leading?: React.ReactNode;
  valueFont?: string;
  children: (close: () => void) => React.ReactNode;
};

/**
 * A field that shows the current choice and opens a sheet of options. Fits any label at any
 * phone width, which a row of segments never does once there are four of them.
 */
export function SelectRow({
  label,
  value,
  leading,
  valueFont = fonts.sansMedium,
  children,
}: SelectRowProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const close = (): void => setOpen(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value}`}
        style={press({
          flex: 1,
          height: 46,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 13,
          borderRadius: radius.control,
          borderWidth: 1,
          borderColor: colors.lineOnLightStrong,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {leading}
          <Text
            style={{
              fontFamily: valueFont,
              fontSize: 15,
              color: colors.gunmetal,
            }}
          >
            {value}
          </Text>
        </View>
        <View style={{ transform: [{ rotate: "90deg" }] }}>
          <Icon name="chevron" color={colors.textMuted} size={16} strokeWidth={2} />
        </View>
      </Pressable>
      <Sheet visible={open} onClose={close} closeLabel={t("common.closeOptions", { label })}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: colors.textSecondary,
              marginBottom: 6,
            }}
          >
            {label}
          </Text>
          {children(close)}
        </View>
      </Sheet>
    </>
  );
}
