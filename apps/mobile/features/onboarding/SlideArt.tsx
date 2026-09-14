import React from "react";
import { Text, View } from "react-native";
import { t, type MessageKey } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import type { OnboardingSlide } from "./slides";

const CARD = {
  backgroundColor: colors.surfaceSoft,
  borderRadius: radius.card,
  borderWidth: 1,
  borderColor: colors.lineOnLightSoft,
  padding: 16,
} as const;

const MONO_LABEL = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textMuted,
} as const;

function ClimbRow({
  name,
  grade,
  detail,
  sent,
}: {
  name: string;
  grade: string;
  detail: string;
  sent: boolean;
}): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <View style={{ flexShrink: 1, gap: 2 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.gunmetal }}
        >
          {name}
        </Text>
        <Text style={MONO_LABEL}>{detail}</Text>
      </View>
      <Text
        style={{
          fontFamily: fonts.monoSemiBold,
          fontSize: 13,
          letterSpacing: 0.5,
          color: sent ? colors.watermelonInk : colors.textMuted,
        }}
      >
        {grade}
      </Text>
    </View>
  );
}

function LogArt(): React.ReactElement {
  return (
    <View style={{ ...CARD, gap: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={MONO_LABEL}>{t("onboarding.art.logHeader")}</Text>
        <Text style={MONO_LABEL}>{t("onboarding.art.climbCount")}</Text>
      </View>
      <View style={{ height: 1, backgroundColor: colors.lineOnLight }} />
      <View style={{ gap: 12 }}>
        <ClimbRow name="Cascade" grade="V6" detail={t("onboarding.art.sendTries")} sent />
        <ClimbRow name="Left Hand Drive" grade="V5" detail={t("onboarding.art.sendTry")} sent />
        <ClimbRow name="Torque" grade="V7" detail={t("onboarding.art.attemptTries")} sent={false} />
      </View>
      <View style={{ height: 1, backgroundColor: colors.lineOnLight }} />
      <Text style={MONO_LABEL}>{t("onboarding.art.logSummary")}</Text>
    </View>
  );
}

function EffortArt(): React.ReactElement {
  const rpe = 8;
  return (
    <View style={{ ...CARD, gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text
          style={{
            fontFamily: fonts.displayHeavy,
            fontSize: 56,
            lineHeight: 58,
            letterSpacing: -2,
            color: colors.gunmetal,
          }}
        >
          {rpe}
        </Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.textMuted }}>/10</Text>
        <View style={{ flex: 1 }} />
        <Text style={MONO_LABEL}>{t("onboarding.art.hardSession")}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 10,
              borderRadius: 3,
              backgroundColor:
                i < rpe ? (i === rpe - 1 ? colors.watermelon : colors.azure) : colors.dataBarEmpty,
            }}
          />
        ))}
      </View>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 13,
          lineHeight: 20,
          color: colors.textSecondary,
        }}
      >
        {t("onboarding.art.effortNote")}
      </Text>
    </View>
  );
}

function StravaArt(): React.ReactElement {
  return (
    <View style={{ ...CARD, gap: 10 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Text style={MONO_LABEL}>{t("onboarding.art.stravaHeader")}</Text>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 9,
            letterSpacing: 0.7,
            textTransform: "uppercase",
            borderRadius: radius.pill,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderWidth: 1,
            borderColor: "rgba(27,98,206,0.4)",
            color: colors.azureInk,
            overflow: "hidden",
          }}
        >
          {t("sessions.onStrava")}
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.gunmetal }}
        >
          {t("onboarding.art.stravaTitle")}
        </Text>
        <View style={{ flexDirection: "row", gap: 10, flexShrink: 0 }}>
          <Text
            style={{
              fontFamily: fonts.monoSemiBold,
              fontSize: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: colors.watermelonInk,
            }}
          >
            {t("onboarding.art.sentGrade")}
          </Text>
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: colors.textMuted,
            }}
          >
            {t("onboarding.art.triedGrade")}
          </Text>
        </View>
      </View>
      <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary }}>
        textTransform: "uppercase",
        {t("onboarding.art.stravaMeta")}
      </Text>
      <View style={{ height: 1, backgroundColor: colors.lineOnLight, marginTop: 4 }} />
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 13,
          lineHeight: 20,
          color: colors.textSecondary,
        }}
      >
        {t("onboarding.art.stravaNote")}
      </Text>
    </View>
  );
}

const VOLUME: Array<{ label: MessageKey | null; value: number }> = [
  { label: "onboarding.art.jul", value: 0.42 },
  { label: null, value: 0.58 },
  { label: null, value: 0.35 },
  { label: "onboarding.art.aug", value: 0.71 },
  { label: null, value: 0.64 },
  { label: null, value: 0.88 },
  { label: "onboarding.art.sep", value: 1 },
  { label: null, value: 0.55 },
];

const BAR_BOX_HEIGHT = 72;

function TrendsArt(): React.ReactElement {
  const peak = Math.max(...VOLUME.map((b) => b.value));
  return (
    <View style={{ ...CARD, gap: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={MONO_LABEL}>{t("onboarding.art.climbsPerWeek")}</Text>
        <Text style={MONO_LABEL}>{t("onboarding.art.lastEightWeeks")}</Text>
      </View>
      <View style={{ gap: 6 }}>
        <View
          style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: BAR_BOX_HEIGHT }}
        >
          {VOLUME.map((bar, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: Math.max(6, Math.round(bar.value * BAR_BOX_HEIGHT)),
                borderRadius: 3,
                backgroundColor: bar.value === peak ? colors.watermelon : colors.azure,
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {VOLUME.map((bar, i) => (
            <Text key={i} style={{ ...MONO_LABEL, flex: 1, fontSize: 8, textAlign: "center" }}>
              {bar.label === null ? "" : t(bar.label)}
            </Text>
          ))}
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: colors.lineOnLight }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={MONO_LABEL}>{t("onboarding.art.hardestSend")}</Text>
        <Text style={MONO_LABEL}>{t("onboarding.art.flashRate")}</Text>
      </View>
    </View>
  );
}

const ART: Record<OnboardingSlide["key"], () => React.ReactElement> = {
  log: LogArt,
  effort: EffortArt,
  strava: StravaArt,
  trends: TrendsArt,
};

export function SlideArt({ slide }: { slide: OnboardingSlide["key"] }): React.ReactElement {
  const Art = ART[slide];
  return <Art />;
}
