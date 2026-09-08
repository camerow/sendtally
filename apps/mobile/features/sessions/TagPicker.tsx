import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { TagOption } from "@sendtally/features/sessions";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";

export type TagPickerProps = {
  tags: string[];
  suggestions: TagOption[];
  placeholder?: string;
  disabled?: boolean;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
};

const MAX_SUGGESTIONS = 8;

export function TagPicker({
  tags,
  suggestions,
  placeholder = "Add a tag",
  disabled = false,
  onAdd,
  onRemove,
}: TagPickerProps): React.ReactElement {
  const [entry, setEntry] = React.useState("");

  function commit(): void {
    onAdd(entry);
    setEntry("");
  }

  return (
    <View style={{ gap: 10 }}>
      {tags.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {tags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => onRemove(tag)}
              disabled={disabled}
              accessibilityLabel={`Remove ${tag}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                minHeight: 40,
                borderRadius: radius.pill,
                backgroundColor: colors.petalTint,
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.monoMedium,
                  fontSize: 11,
                  letterSpacing: 0.6,
                  color: colors.gunmetal,
                }}
              >
                {tag.toUpperCase()}
              </Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted }}>
                ✕
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <TextInput
        value={entry}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        editable={!disabled}
        autoCapitalize="words"
        returnKeyType="done"
        onChangeText={setEntry}
        onSubmitEditing={commit}
        onBlur={() => entry.trim() !== "" && commit()}
        style={{
          fontFamily: fonts.sans,
          fontSize: 15,
          color: colors.gunmetal,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: "rgba(64,63,76,0.15)",
          borderRadius: radius.control,
          paddingHorizontal: 14,
          minHeight: 46,
        }}
      />
      {suggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, alignItems: "center" }}
        >
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 9,
              letterSpacing: 0.7,
              color: colors.textMuted,
            }}
          >
            RECENT
          </Text>
          {suggestions.slice(0, MAX_SUGGESTIONS).map((option) => (
            <Chip
              key={option.slug}
              label={`+ ${option.name.toUpperCase()}`}
              active={false}
              disabled={disabled}
              onPress={() => onAdd(option.name)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
