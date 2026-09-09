import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SessionRow } from "@sendtally/api-client";
import {
  UNTAGGED_KEY,
  UNTAGGED_LABEL,
  countLabel,
  filterSessionsByTags,
  type SessionGrouping,
  type TagOption,
} from "@sendtally/features/sessions";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";

export type SessionFilters = { grouping: SessionGrouping; tags: string[] };

export type FilterSheetProps = {
  visible: boolean;
  sessions: SessionRow[];
  tagOptions: TagOption[];
  untaggedCount: number;
  filters: SessionFilters;
  onApply: (filters: SessionFilters) => void;
  onClose: () => void;
};

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  lineHeight: 13,
  letterSpacing: 0.8,
  color: colors.textMuted,
} as const;

export function FilterSheet({
  visible,
  sessions,
  tagOptions,
  untaggedCount,
  filters,
  onApply,
  onClose,
}: FilterSheetProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = React.useState<SessionFilters>(filters);

  React.useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const toggleTag = (slug: string): void =>
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(slug) ? prev.tags.filter((s) => s !== slug) : [...prev.tags, slug],
    }));
  const count = filterSessionsByTags(sessions, draft.tags).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close filters"
        style={{ flex: 1, backgroundColor: "rgba(64,63,76,0.45)" }}
      />
      <View
        style={{
          gap: 18,
          paddingTop: 10,
          paddingHorizontal: 18,
          paddingBottom: Math.max(insets.bottom, 16) + 18,
          borderTopLeftRadius: radius.panel,
          borderTopRightRadius: radius.panel,
          backgroundColor: colors.white,
        }}
      >
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
            onPress={() => setDraft({ grouping: "month", tags: [] })}
            accessibilityRole="button"
            hitSlop={8}
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
          <Text style={label}>GROUP BY</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["month", "tag"] as const).map((value) => (
              <Chip
                key={value}
                label={value.toUpperCase()}
                active={draft.grouping === value}
                onPress={() => setDraft((prev) => ({ ...prev, grouping: value }))}
              />
            ))}
          </View>
        </View>
        {tagOptions.length > 0 && (
          <View style={{ gap: 9 }}>
            <Text style={label}>TAGS</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {tagOptions.map((tag) => (
                <Chip
                  key={tag.slug}
                  label={`${tag.name.toUpperCase()} ${tag.count}`}
                  active={draft.tags.includes(tag.slug)}
                  onPress={() => toggleTag(tag.slug)}
                />
              ))}
              {untaggedCount > 0 && (
                <Chip
                  label={`${UNTAGGED_LABEL.toUpperCase()} ${untaggedCount}`}
                  active={draft.tags.includes(UNTAGGED_KEY)}
                  onPress={() => toggleTag(UNTAGGED_KEY)}
                />
              )}
            </View>
          </View>
        )}
        <Pressable
          onPress={() => onApply(draft)}
          accessibilityRole="button"
          style={{
            height: 48,
            marginTop: 4,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.control,
            backgroundColor: colors.azureInk,
          }}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
            Show {countLabel(count).toLowerCase()}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
