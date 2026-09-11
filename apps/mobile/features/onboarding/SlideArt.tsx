import React from "react";
import { Text, View } from "react-native";
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
        <Text style={MONO_LABEL}>THU SEP 3 · INDOOR · 1H 52M</Text>
        <Text style={MONO_LABEL}>14 CLIMBS</Text>
      </View>
      <View style={{ height: 1, backgroundColor: colors.lineOnLight }} />
      <View style={{ gap: 12 }}>
        <ClimbRow name="Cascade" grade="V6" detail="SEND · 3 TRIES" sent />
        <ClimbRow name="Left Hand Drive" grade="V5" detail="SEND · 1 TRY" sent />
        <ClimbRow name="Torque" grade="V7" detail="ATTEMPT · 4 TRIES" sent={false} />
      </View>
      <View style={{ height: 1, backgroundColor: colors.lineOnLight }} />
      <Text style={MONO_LABEL}>10 SENDS · 4 ATTEMPTS · AVG V4.6</Text>
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
        <Text style={MONO_LABEL}>HARD SESSION</Text>
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
        Scored against your own last eight weeks, not a global scale.
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
        <Text style={MONO_LABEL}>THU SEP 3 · 1H 52M</Text>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 9,
            letterSpacing: 0.7,
            borderRadius: radius.pill,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderWidth: 1,
            borderColor: "rgba(27,98,206,0.4)",
            color: colors.azureInk,
            overflow: "hidden",
          }}
        >
          ON STRAVA
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
          Hard climbing session
        </Text>
        <View style={{ flexDirection: "row", gap: 10, flexShrink: 0 }}>
          <Text
            style={{
              fontFamily: fonts.monoSemiBold,
              fontSize: 12,
              letterSpacing: 0.5,
              color: colors.watermelonInk,
            }}
          >
            SENT V6
          </Text>
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 12,
              letterSpacing: 0.5,
              color: colors.textMuted,
            }}
          >
            TRIED V7
          </Text>
        </View>
      </View>
      <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary }}>
        14 CLIMBS · RPE 8/10
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
        Posted once, with the climb log in the description.
      </Text>
    </View>
  );
}

const VOLUME = [
  { label: "JUL", value: 0.42 },
  { label: "", value: 0.58 },
  { label: "", value: 0.35 },
  { label: "AUG", value: 0.71 },
  { label: "", value: 0.64 },
  { label: "", value: 0.88 },
  { label: "SEP", value: 1 },
  { label: "", value: 0.55 },
];

const BAR_BOX_HEIGHT = 72;

function TrendsArt(): React.ReactElement {
  const peak = Math.max(...VOLUME.map((b) => b.value));
  return (
    <View style={{ ...CARD, gap: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={MONO_LABEL}>CLIMBS PER WEEK</Text>
        <Text style={MONO_LABEL}>LAST 8 WEEKS</Text>
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
              {bar.label}
            </Text>
          ))}
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: colors.lineOnLight }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={MONO_LABEL}>HARDEST SEND V7</Text>
        <Text style={MONO_LABEL}>FLASH RATE 38%</Text>
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
