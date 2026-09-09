import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { StravaPostingFeature } from "@sendtally/features/settings";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { bodyText, messageText } from "../../lib/styles";

export type StravaPostingSectionProps = {
  posting: StravaPostingFeature;
};

const rowTitle = {
  fontFamily: fonts.sansSemiBold,
  fontSize: 13,
  color: colors.gunmetal,
} as const;

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
  label: string;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      hitSlop={10}
      style={{
        width: 46,
        height: 28,
        borderRadius: radius.pill,
        padding: 3,
        justifyContent: "center",
        backgroundColor: checked ? colors.azureInk : "rgba(64,63,76,0.22)",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.pill,
          backgroundColor: colors.white,
          marginLeft: checked ? 18 : 0,
        }}
      />
    </Pressable>
  );
}

export function StravaPostingSection({ posting }: StravaPostingSectionProps): React.ReactElement {
  return (
    <>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.lineOnLight }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          minHeight: 44,
        }}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={rowTitle}>Post sessions to Strava</Text>
          <Text style={bodyText}>
            {posting.enabled
              ? "Logged sessions post to your feed as Rock Climbing activities."
              : "Off. Each session keeps a Post to Strava action on its own page."}
          </Text>
        </View>
        <Switch
          checked={posting.enabled}
          onChange={posting.setEnabled}
          disabled={posting.busy}
          label="Post sessions to Strava"
        />
      </View>

      {posting.enabled && (
        <>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.lineOnLight }} />
          <View style={{ gap: 8 }}>
            <Text style={rowTitle}>Post sessions logged from</Text>
            <Text style={bodyText}>Anything earlier stays in sendtally only.</Text>
            <TextInput
              value={posting.since}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textFaint}
              editable={!posting.busy}
              autoCapitalize="none"
              onChangeText={posting.setSince}
              style={{
                fontFamily: fonts.mono,
                fontSize: 13,
                color: colors.gunmetal,
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: "rgba(64,63,76,0.15)",
                borderRadius: radius.control,
                paddingHorizontal: 13,
                minHeight: 44,
              }}
            />
          </View>
        </>
      )}

      {posting.error !== null && <Text style={messageText}>{posting.error}</Text>}
    </>
  );
}
