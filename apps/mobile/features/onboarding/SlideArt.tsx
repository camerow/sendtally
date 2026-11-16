import React from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Pyramid } from "../../components/Pyramid";
import type { OnboardingSlide } from "./slides";

/** Every card is the log-and-pyramid card's height, so the art never jumps between slides. */
export const ART_CARD_HEIGHT = 303;

const PLAY_MS = 2400;

type Play = Readonly<SharedValue<number>>;

const CARD = {
  height: ART_CARD_HEIGHT,
  justifyContent: "space-between",
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

const TITLE = { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal } as const;

/**
 * 0 to 1, run once the first time the slide shows. Reanimated's timing follows the system's
 * Reduce Motion, which jumps straight to 1, so the art shows its last frame.
 */
function usePlayOnce(show: boolean): Play {
  const progress = useSharedValue(0);
  React.useEffect(() => {
    if (show)
      progress.value = withTiming(1, { duration: PLAY_MS, easing: Easing.out(Easing.quad) });
  }, [show, progress]);
  return progress;
}

/** Where `p` is between `from` and `to`, as 0 to 1. */
function stage(p: number, from: number, to: number): number {
  "worklet";
  return interpolate(p, [from, to], [0, 1], Extrapolation.CLAMP);
}

/** Fades in and rises into place between two points of the play. */
function Arrive({
  play,
  from,
  to,
  children,
}: {
  play: Play;
  from: number;
  to: number;
  children: React.ReactNode;
}): React.ReactElement {
  const style = useAnimatedStyle(() => {
    const s = stage(play.value, from, to);
    return { opacity: s, transform: [{ translateY: (1 - s) * 8 }] };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

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
          color: sent ? colors.gunmetal : colors.textMuted,
        }}
      >
        {grade}
      </Text>
    </View>
  );
}

const PYRAMID = [
  { gradeLabel: "V7", inner: 0, outer: 2, countLabel: "0/2" },
  { gradeLabel: "V6", inner: 3, outer: 1, countLabel: "3/4" },
  { gradeLabel: "V5", inner: 5, outer: 2, countLabel: "5/7" },
  { gradeLabel: "V4", inner: 6, outer: 1, countLabel: "6/7" },
];

function IntroArt({ play }: { play: Play }): React.ReactElement {
  const grow = useDerivedValue(() => stage(play.value, 0.3, 0.6));
  const effort = useAnimatedStyle(() => ({ opacity: stage(play.value, 0.45, 0.6) }));
  return (
    <View style={{ ...CARD, gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={MONO_LABEL}>{t("onboarding.art.logHeader")}</Text>
        <Animated.Text
          style={[{ fontFamily: fonts.monoSemiBold, fontSize: 12, color: colors.gunmetal }, effort]}
        >
          {t("onboarding.art.effort", { n: 8 })}
        </Animated.Text>
      </View>
      <View style={{ height: 1, backgroundColor: colors.lineOnLight }} />
      <Arrive play={play} from={0} to={0.15}>
        <ClimbRow name="Cascade" grade="V6" detail={t("onboarding.art.sendTries")} sent />
      </Arrive>
      <Arrive play={play} from={0.06} to={0.21}>
        <ClimbRow name="Left Hand Drive" grade="V5" detail={t("onboarding.art.sendTry")} sent />
      </Arrive>
      <Arrive play={play} from={0.12} to={0.27}>
        <ClimbRow name="Torque" grade="V7" detail={t("onboarding.art.attemptTries")} sent={false} />
      </Arrive>
      <Pyramid rows={PYRAMID} label={t("trends.gradePyramid")} grow={grow} />
    </View>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const LINE_LENGTH = 360;

function ExercisesArt({ play }: { play: Play }): React.ReactElement {
  const line = useAnimatedProps(() => ({
    strokeDashoffset: LINE_LENGTH * (1 - stage(play.value, 0.1, 0.6)),
  }));
  const dot = useAnimatedProps(() => ({ opacity: stage(play.value, 0.55, 0.7) }));
  return (
    <View style={{ ...CARD, gap: 8 }}>
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}
      >
        <Text style={TITLE}>{`${t("workouts.builtIn.max10.name")} · 20mm`}</Text>
        <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 13, color: colors.petalInk }}>
          +12 kg
        </Text>
      </View>
      <Text style={MONO_LABEL}>{t("onboarding.art.addedLoad")}</Text>
      <View style={{ flex: 1 }}>
        <Svg width="100%" height="100%" viewBox="-6 0 298 200" preserveAspectRatio="none">
          <Path d="M0 190 H280" stroke={colors.dataBarEmpty} strokeWidth={1} />
          <AnimatedPath
            d="M0 176 L40 164 L80 152 L120 132 L160 120 L200 94 L240 74 L280 46"
            fill="none"
            stroke={colors.petalInk}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={LINE_LENGTH}
            animatedProps={line}
          />
          <AnimatedCircle cx={280} cy={46} r={5} fill={colors.petalInk} animatedProps={dot} />
        </Svg>
      </View>
    </View>
  );
}

const RING = 226;

/** An exercise row; the highlight moves from the first to the next as the rest ends. */
function Exercise({
  play,
  name,
  dose,
  lit,
}: {
  play: Play;
  name: string;
  dose: string;
  lit: "now" | "next" | null;
}): React.ReactElement {
  const tint = useAnimatedStyle(() => {
    const moved = stage(play.value, 0.3, 0.35);
    return { opacity: lit === "now" ? 1 - moved : lit === "next" ? moved : 0 };
  });
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 8,
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            borderRadius: 8,
            backgroundColor: colors.strengthTint,
          },
          tint,
        ]}
      />
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.gunmetal }}>
        {name}
      </Text>
      <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.fern }}>{dose}</Text>
    </View>
  );
}

function WorkoutsArt({ play }: { play: Play }): React.ReactElement {
  // The rest runs down part way, so its last frame still shows the ring.
  const ring = useAnimatedProps(() => ({ strokeDashoffset: RING * 0.6 * play.value }));
  return (
    <View style={CARD}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Svg width={84} height={84} viewBox="0 0 84 84">
          <Circle cx={42} cy={42} r={36} fill="none" stroke={colors.dataBarEmpty} strokeWidth={6} />
          <AnimatedCircle
            cx={42}
            cy={42}
            r={36}
            fill="none"
            stroke={colors.fern}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={RING}
            transform="rotate(-90 42 42)"
            animatedProps={ring}
          />
        </Svg>
        <View style={{ gap: 2, flexShrink: 1 }}>
          <Text style={MONO_LABEL}>
            {t("onboarding.art.rest", { workout: t("workouts.builtIn.strength-antagonist.name") })}
          </Text>
          <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 34, color: colors.gunmetal }}>
            1:30
          </Text>
        </View>
      </View>
      <View>
        <Exercise play={play} name={t("workouts.exercise.pushUps")} dose="3 × 15" lit="now" />
        <Exercise play={play} name={t("workouts.exercise.overheadPress")} dose="3 × 8" lit="next" />
        <Exercise play={play} name={t("workouts.exercise.dips")} dose="3 × 10" lit={null} />
        <Exercise
          play={play}
          name={t("workouts.exercise.externalRotation")}
          dose="4 × 15"
          lit={null}
        />
      </View>
    </View>
  );
}

/** Each week's load against the heaviest: three that build, then the deload. */
const WEEKS = [0.6, 0.78, 1, 0.4];

function Week({
  play,
  n,
  load,
  deload,
}: {
  play: Play;
  n: number;
  load: number;
  deload: boolean;
}): React.ReactElement {
  const grow = useAnimatedStyle(() => ({
    transform: [{ scaleY: stage(play.value, 0.1 + n * 0.06, 0.5 + n * 0.06) }],
  }));
  return (
    <View style={{ flex: 1, height: "100%", alignItems: "center", gap: 6 }}>
      <View style={{ flex: 1, width: "100%", justifyContent: "flex-end" }}>
        <Animated.View
          style={[
            {
              height: `${load * 100}%`,
              borderRadius: 6,
              backgroundColor: deload ? colors.lineOnLightStrong : colors.fern,
              transformOrigin: "bottom",
            },
            grow,
          ]}
        />
      </View>
      <Text style={{ ...MONO_LABEL, color: colors.gunmetal }}>
        {t("plan.weekShort", { n: n + 1 })}
      </Text>
    </View>
  );
}

function BlocksArt({ play }: { play: Play }): React.ReactElement {
  return (
    <View style={{ ...CARD, gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={TITLE}>{t("onboarding.art.fingerStrength")}</Text>
        <Text style={MONO_LABEL}>{t("climbs.weekCount", { count: WEEKS.length })}</Text>
      </View>
      <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
        {WEEKS.map((load, i) => (
          <Week key={i} play={play} n={i} load={load} deload={i === WEEKS.length - 1} />
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={MONO_LABEL}>{t("onboarding.art.loadBuilds")}</Text>
        <Text style={MONO_LABEL}>{t("onboarding.art.deload")}</Text>
      </View>
    </View>
  );
}

const ART: Record<OnboardingSlide["key"], (props: { play: Play }) => React.ReactElement> = {
  intro: IntroArt,
  exercises: ExercisesArt,
  workouts: WorkoutsArt,
  blocks: BlocksArt,
};

/** A slide's art, which plays once the first time `show` is true. */
export function SlideArt({
  slide,
  show,
}: {
  slide: OnboardingSlide["key"];
  show: boolean;
}): React.ReactElement {
  const play = usePlayOnce(show);
  const Art = ART[slide];
  return <Art play={play} />;
}
