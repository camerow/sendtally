import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { tagMatches, type TagOption } from "@sendtally/features/sessions";
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

export function TagPicker({
  tags,
  suggestions,
  placeholder = "Add a tag",
  disabled = false,
  onAdd,
  onRemove,
}: TagPickerProps): React.ReactElement {
  const [entry, setEntry] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);
  const { options, create } = tagMatches(suggestions, entry);

  function pick(name: string): void {
    onAdd(name);
    setEntry("");
  }

  function submit(): void {
    const first = options[0]?.name ?? create;
    if (first !== null && first !== undefined) pick(first);
  }

  const showStrip = focused && !disabled && (options.length > 0 || create !== null);

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
            accessibilityLabel={`Remove ${tag}`}
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
                color: colors.gunmetal,
              }}
            >
              {tag.toUpperCase()}
            </Text>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted }}>✕</Text>
          </Pressable>
        ))}
        <TextInput
          ref={inputRef}
          value={entry}
          placeholder={tags.length === 0 ? placeholder : "Add a tag"}
          placeholderTextColor={colors.textFaint}
          editable={!disabled}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          blurOnSubmit={false}
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
      {showStrip && (
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, alignItems: "center" }}
        >
          {entry.trim() === "" && (
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
          )}
          {options.map((option) => (
            <Chip
              key={option.slug}
              label={option.name.toUpperCase()}
              active={false}
              onPress={() => pick(option.name)}
            />
          ))}
          {create !== null && (
            <Chip
              label={`+ CREATE “${create.toUpperCase()}”`}
              active={false}
              dashed
              onPress={() => pick(create)}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}
