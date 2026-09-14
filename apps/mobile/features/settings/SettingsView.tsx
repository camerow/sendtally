import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SettingsVM, StravaPostingFeature } from "@sendtally/features/settings";
import type { StravaConnectFeature } from "./useStravaConnect";
import type { Discipline, GradePrefs, GradeScale } from "@sendtally/features/log-session";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { ScreenHeader } from "../../components/ScreenHeader";
import { pressRow } from "../../lib/press";
import { GradeSection } from "./GradeSection";
import { MembershipSection, type MembershipSectionProps } from "./MembershipSection";
import { StravaPostingSection } from "./StravaPostingSection";
import { bodyText, messageText, sectionCard, sectionLabel } from "../../lib/styles";
import { press } from "../../lib/press";

export type SettingsViewProps = {
  vm: SettingsVM;
  email: string;
  gradePrefs: GradePrefs;
  billing: MembershipSectionProps | null;
  posting: StravaPostingFeature;
  connect: StravaConnectFeature;
  onChangeGradePref: (discipline: Discipline, scale: GradeScale) => void;
  onOpenAccount: () => void;
};

function StatusPill({ label, active }: { label: string; active: boolean }): React.ReactElement {
  return (
    <Text
      style={{
        fontFamily: fonts.monoMedium,
        fontSize: 9,
        letterSpacing: 0.7,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.pill,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: active ? "rgba(27,98,206,0.4)" : colors.lineOnLightStrong,
        color: active ? colors.azureInk : colors.textMuted,
      }}
    >
      {label}
    </Text>
  );
}

export function SettingsView({
  vm,
  email,
  gradePrefs,
  billing,
  posting,
  connect,
  onChangeGradePref,
  onOpenAccount,
}: SettingsViewProps): React.ReactElement {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title="Settings" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 4,
          paddingBottom: 24,
          gap: 14,
        }}
      >
        <GradeSection prefs={gradePrefs} onChange={onChangeGradePref} />

        <View style={sectionCard}>
          <View
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text style={sectionLabel}>STRAVA</Text>
            <StatusPill label={vm.stravaStatusLabel} active={vm.stravaActive} />
          </View>
          <Text style={bodyText}>
            {vm.stravaActive
              ? "Linked to your Strava account. Sessions you log can post to your feed as Rock Climbing activities."
              : vm.stravaConnected
                ? "Strava access has lapsed. Re-link it and your sessions can post to your feed again."
                : "Each logged session can post to your feed as a Rock Climbing activity. You approve it on strava.com and can revoke it there any time."}
          </Text>
          {vm.stravaActive ? (
            <StravaPostingSection posting={posting} />
          ) : (
            <>
              <Pressable
                onPress={connect.connect}
                disabled={connect.busy}
                accessibilityRole="button"
                style={press({
                  minHeight: 46,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radius.control,
                  borderWidth: 1,
                  borderColor: colors.lineOnLightStrong,
                  backgroundColor: colors.white,
                  opacity: connect.busy ? 0.55 : 1,
                })}
              >
                <Text
                  style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}
                >
                  {connect.busy
                    ? "Opening Strava…"
                    : vm.stravaConnected
                      ? "Re-link Strava"
                      : "Connect Strava"}
                </Text>
              </Pressable>
              {connect.error !== null && <Text style={messageText}>{connect.error}</Text>}
            </>
          )}
        </View>

        {billing !== null && (
          <View style={sectionCard}>
            <MembershipSection {...billing} />
          </View>
        )}

        <Pressable
          onPress={onOpenAccount}
          accessibilityRole="button"
          accessibilityLabel="Account"
          style={pressRow({
            ...sectionCard,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            minHeight: 44,
          })}
        >
          <View style={{ gap: 4, flexShrink: 1 }}>
            <Text style={sectionLabel}>ACCOUNT</Text>
            <Text
              numberOfLines={1}
              style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}
            >
              {email}
            </Text>
          </View>
          <Icon name="chevron" color={colors.textFaint} size={16} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
