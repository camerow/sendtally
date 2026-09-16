import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { tagMatches, type TagOption } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { pressRow } from "../../lib/press";

export type TagPickerProps = {
  tags: string[];
  suggestions: TagOption[];
  placeholder?: string;
  disabled?: boolean;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
};

const caption = {
  fontFamily: fonts.monoMedium,
  fontSize: 9,
  letterSpacing: 0.7,
  textTransform: "uppercase",
  color: colors.textMuted,
} as const;

function DropdownRow({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={pressRow({
        justifyContent: "center",
        height: 40,
        paddingHorizontal: 12,
        borderRadius: radius.sm,
      })}
    >
      {children}
    </Pressable>
  );
}

/**
 * Typing filters the user's tags into a dropdown, like a climb name does; the most used tags
 * stay out as pills the whole time, since most sessions reuse one of them.
 */
export function TagPicker({
  tags,
  suggestions,
  placeholder,
  disabled = false,
  onAdd,
  onRemove,
}: TagPickerProps): React.ReactElement {
  const [entry, setEntry] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);
  const { options, create } = tagMatches(suggestions, entry);
  const recent = tagMatches(suggestions, "").options;
  const showDropdown = focused && entry.trim() !== "" && (options.length > 0 || create !== null);

  function pick(name: string): void {
    onAdd(name);
    setEntry("");
  }

  function submit(): void {
    const first = options[0]?.name ?? create;
    if (first !== null && first !== undefined) pick(first);
  }

  return (
    <View style={{ gap: 10 }}>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        disabled={disabled}
        style={pressRow({
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
          minHeight: 46,
          paddingVertical: 5,
          paddingHorizontal: 9,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: focused ? colors.azure : "rgba(64,63,76,0.15)",
          borderRadius: radius.control,
        })}
      >
        {tags.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => onRemove(tag)}
            disabled={disabled}
            hitSlop={5}
            accessibilityLabel={t("common.removeTag", { tag })}
            style={pressRow({
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingLeft: 11,
              paddingRight: 8,
              minHeight: 34,
              borderRadius: radius.pill,
              backgroundColor: colors.petalTint,
              opacity: disabled ? 0.5 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 11,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.gunmetal,
              }}
            >
              {tag}
            </Text>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted }}>✕</Text>
          </Pressable>
        ))}
        <TextInput
          ref={inputRef}
          value={entry}
          placeholder={
            tags.length === 0 ? (placeholder ?? t("common.addATag")) : t("common.addATag")
          }
          placeholderTextColor={colors.textFaint}
          editable={!disabled}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          submitBehavior="submit"
          onChangeText={setEntry}
          onSubmitEditing={submit}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setEntry("");
          }}
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            color: colors.gunmetal,
            flexGrow: 1,
            minWidth: 80,
            minHeight: 34,
            paddingHorizontal: 4,
            paddingVertical: 0,
          }}
        />
      </Pressable>
      {showDropdown && (
        <View
          style={{
            gap: 2,
            padding: 6,
            borderWidth: 1,
            borderColor: "rgba(64,63,76,0.15)",
            borderRadius: radius.control,
          }}
        >
          {options.map((option) => (
            <DropdownRow key={option.slug} onPress={() => pick(option.name)}>
              <Text
                style={{
                  fontFamily: fonts.monoMedium,
                  fontSize: 11,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: colors.gunmetal,
                }}
              >
                {option.name}
              </Text>
            </DropdownRow>
          ))}
          {create !== null && (
            <DropdownRow onPress={() => pick(create)}>
              <Text
                style={{
                  fontFamily: fonts.monoMedium,
                  fontSize: 11,
                  letterSpacing: 0.6,
                  color: colors.azureInk,
                }}
              >
                {t("sessions.createTag", { name: create })}
              </Text>
            </DropdownRow>
          )}
        </View>
      )}
      {recent.length > 0 && (
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, alignItems: "center" }}
        >
          <Text style={caption}>{t("common.recent")}</Text>
          {recent.map((option) => (
            <Chip
              key={option.slug}
              label={option.name}
              active={false}
              disabled={disabled}
              onPress={() => pick(option.name)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
