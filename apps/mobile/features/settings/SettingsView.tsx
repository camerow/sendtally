import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SettingsVM, StravaPostingFeature } from "@sendtally/features/settings";
import type { Discipline, GradePrefs, GradeScale } from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { ScreenHeader } from "../../components/ScreenHeader";
import { pressRow } from "../../lib/press";
import { GradeSection } from "./GradeSection";
import { MembershipSection, type MembershipSectionProps } from "./MembershipSection";
import { StravaPostingSection } from "./StravaPostingSection";
import { bodyText, sectionCard, sectionLabel } from "../../lib/styles";

export type SettingsViewProps = {
  vm: SettingsVM;
  email: string;
  gradePrefs: GradePrefs;
  billing: MembershipSectionProps | null;
  posting: StravaPostingFeature;
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
        textTransform: "uppercase",
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
  onChangeGradePref,
  onOpenAccount,
}: SettingsViewProps): React.ReactElement {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title={t("common.settings")} />
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
            <Text style={sectionLabel}>Strava</Text>
            <StatusPill label={vm.stravaStatusLabel} active={vm.stravaActive} />
          </View>
          <Text style={bodyText}>
            {vm.stravaActive
              ? t("settings.stravaActive")
              : vm.stravaConnected
                ? t("settings.stravaLapsedMobile")
                : t("settings.stravaNotConnectedMobile")}
          </Text>
          {vm.stravaActive && <StravaPostingSection posting={posting} />}
        </View>

        {billing !== null && (
          <View style={sectionCard}>
            <MembershipSection {...billing} />
          </View>
        )}

        <Pressable
          onPress={onOpenAccount}
          accessibilityRole="button"
          accessibilityLabel={t("common.account")}
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
            <Text style={sectionLabel}>{t("common.account")}</Text>
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
