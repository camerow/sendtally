import React from "react";
import { Keyboard, Pressable, Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { TextInput } from "../../components/TextInput";
import { pressRow } from "../../lib/press";

export type Suggestion = { key: string; name: string; meta: string };

export type SuggestFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  suggestions: readonly Suggestion[];
  /** What was typed is not found anywhere, so saving creates it. */
  isNew: boolean;
  hint?: string | null;
  onChangeText: (text: string) => void;
  onPick: (key: string) => void;
};

const eyebrow = {
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  letterSpacing: 0.9,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

/** A text field whose matches open under it while it is focused; anything else typed is new. */
export function SuggestField({
  label,
  value,
  placeholder,
  suggestions,
  isNew,
  hint = null,
  onChangeText,
  onPick,
}: SuggestFieldProps): React.ReactElement {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={eyebrow}>{label}</Text>
      <View
        style={{
          minHeight: 50,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          borderRadius: radius.control + 2,
          borderWidth: 1.5,
          borderColor: focused ? colors.gunmetal : "transparent",
          backgroundColor: focused ? colors.white : colors.surfaceSoft,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCorrect={false}
          autoComplete="off"
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          accessibilityLabel={label}
          style={{
            flex: 1,
            minHeight: 46,
            fontFamily: fonts.sansSemiBold,
            fontSize: 15,
            color: colors.gunmetal,
          }}
        />
        {isNew && !focused && (
          <Text style={{ ...eyebrow, color: colors.fern }}>{t("climbs.new")}</Text>
        )}
      </View>
      {hint !== null && (
        <Text
          style={{
            paddingLeft: 2,
            fontFamily: fonts.sans,
            fontSize: 12.5,
            color: colors.textSecondary,
          }}
        >
          {hint}
        </Text>
      )}
      {focused && suggestions.length > 0 && (
        <View
          style={{
            borderRadius: radius.control + 2,
            borderWidth: 1,
            borderColor: colors.lineOnLight,
            backgroundColor: colors.white,
            overflow: "hidden",
          }}
        >
          {suggestions.map((s, i) => (
            <Pressable
              key={s.key}
              onPress={() => {
                Keyboard.dismiss();
                onPick(s.key);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${s.name}, ${s.meta}`}
              style={pressRow({
                minHeight: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                paddingHorizontal: 14,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.lineOnLightSoft,
              })}
            >
              <Text
                numberOfLines={1}
                style={{
                  flexShrink: 1,
                  fontFamily: fonts.sans,
                  fontSize: 14.5,
                  color: colors.gunmetal,
                }}
              >
                {s.name}
              </Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary }}>
                {s.meta}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
