import React from "react";
import { Pressable, Text, View } from "react-native";
import { UNTAGGED_KEY, UNTAGGED_LABEL, type TagOption } from "@sendtally/features/sessions";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { Sheet } from "../../components/Sheet";
import { press } from "../../lib/press";

export type TrendFilterSheetProps = {
  visible: boolean;
  tagOptions: TagOption[];
  untaggedCount: number;
  selectedTags: string[];
  onApply: (tags: string[]) => void;
  onClose: () => void;
};

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  lineHeight: 13,
  letterSpacing: 0.8,
  color: colors.textMuted,
} as const;

export function TrendFilterSheet({
  visible,
  tagOptions,
  untaggedCount,
  selectedTags,
  onApply,
  onClose,
}: TrendFilterSheetProps): React.ReactElement {
  const [draft, setDraft] = React.useState<string[]>(selectedTags);

  React.useEffect(() => {
    if (visible) setDraft(selectedTags);
  }, [visible, selectedTags]);

  const toggle = (slug: string): void =>
    setDraft((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  return (
    <Sheet visible={visible} onClose={onClose} closeLabel="Close filters">
      <View style={{ gap: 18, paddingTop: 10, paddingHorizontal: 18, paddingBottom: 18 }}>
        <View
          style={{
            alignSelf: "center",
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(64,63,76,0.2)",
          }}
        />
        <View
          style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}
        >
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 22,
              letterSpacing: -0.5,
              color: colors.gunmetal,
            }}
          >
            Filters
          </Text>
          <Pressable
            onPress={() => setDraft([])}
            accessibilityRole="button"
            hitSlop={8}
            style={press({})}
          >
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 11,
                letterSpacing: 0.66,
                color: colors.azureInk,
              }}
            >
              CLEAR
            </Text>
          </Pressable>
        </View>
        <View style={{ gap: 9 }}>
          <Text style={label}>TAGS</Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 13,
              lineHeight: 20,
              color: colors.textSecondary,
            }}
          >
            Every trend below is drawn from the sessions carrying these tags.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {tagOptions.map((tag) => (
              <Chip
                key={tag.slug}
                label={`${tag.name.toUpperCase()} ${tag.count}`}
                active={draft.includes(tag.slug)}
                onPress={() => toggle(tag.slug)}
              />
            ))}
            {untaggedCount > 0 && (
              <Chip
                label={`${UNTAGGED_LABEL.toUpperCase()} ${untaggedCount}`}
                active={draft.includes(UNTAGGED_KEY)}
                onPress={() => toggle(UNTAGGED_KEY)}
              />
            )}
          </View>
        </View>
        <Pressable
          onPress={() => onApply(draft)}
          accessibilityRole="button"
          style={press({
            height: 48,
            marginTop: 4,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.control,
            backgroundColor: colors.azureInk,
          })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
            {draft.length === 0 ? "Show all sessions" : "Show these trends"}
          </Text>
        </Pressable>
      </View>
    </Sheet>
  );
}
