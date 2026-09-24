import React from "react";
import { Pressable, Switch, Text, View } from "react-native";
import type { ClimbSummary } from "@sendtally/api-client";
import {
  climbOutcome,
  disciplineOf,
  sendStyleLabel,
  withClimbOutcome,
  withTries,
  type ClimbDraft,
  type ClimbOutcome,
  type ClimbStyle,
} from "@sendtally/features/log-session";
import {
  firstGoStyleOf,
  resultOutcome,
  type FirstGoStyle,
} from "@sendtally/features/log-session/resultRule";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press, pressRow, tap } from "../../lib/press";

const STYLE_FILL: Record<ClimbStyle, { fill: string; ink: string }> = {
  redpoint: { fill: colors.azureInk, ink: colors.white },
  flash: { fill: colors.gold, ink: colors.gunmetal },
  onsight: { fill: colors.petalInk, ink: colors.white },
};

const ATTEMPT_FILL = { fill: colors.gunmetal, ink: colors.white };

const FIRST_GO_STYLES: readonly FirstGoStyle[] = ["onsight", "flash"];

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

const row = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 12,
  borderTopWidth: 1,
  borderTopColor: colors.lineOnLightSoft,
} as const;

export function outcomeFill(outcome: ClimbOutcome): { fill: string; ink: string } {
  return outcome.kind === "send" ? STYLE_FILL[outcome.style] : ATTEMPT_FILL;
}

function Mark({ outcome }: { outcome: ClimbOutcome }): React.ReactElement {
  const { fill, ink } = outcomeFill(outcome);
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: fill,
      }}
    >
      {outcome.kind === "send" ? (
        <Icon name="check" color={ink} size={18} strokeWidth={2.4} />
      ) : (
        <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 16, color: ink }}>✗</Text>
      )}
    </View>
  );
}

function StepButton({
  glyph,
  disabled = false,
  onPress,
}: {
  glyph: string;
  disabled?: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={tap(onPress)}
      disabled={disabled}
      style={press({
        width: 40,
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(64,63,76,0.18)",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.monoMedium, fontSize: 16, color: colors.gunmetal }}>
        {glyph}
      </Text>
    </Pressable>
  );
}

function StyleRadio({
  style,
  checked,
  onPress,
}: {
  style: FirstGoStyle;
  checked: boolean;
  onPress: () => void;
}): React.ReactElement {
  const { fill, ink } = STYLE_FILL[style];
  return (
    <Pressable
      onPress={tap(onPress)}
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      accessibilityLabel={sendStyleLabel("route", style)}
      style={press({ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 40 })}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: fill,
          backgroundColor: checked ? fill : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <Icon name="check" color={ink} size={14} strokeWidth={2.6} />}
      </View>
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}>
        {sendStyleLabel("route", style)}
      </Text>
    </Pressable>
  );
}

export type ResultFieldsProps = {
  climb: ClimbDraft;
  known: ClimbSummary | null;
  onChange: (climb: ClimbDraft) => void;
};

/**
 * Sent or not, then how many tries; the style falls out of those two. A one-try route still
 * asks onsight or flash, and that pick is remembered so a tries change and back keeps it.
 */
export function ResultFields({ climb, known, onChange }: ResultFieldsProps): React.ReactElement {
  const discipline = disciplineOf(climb.scale);
  const [firstGo, setFirstGo] = React.useState<FirstGoStyle>(() => firstGoStyleOf(climb));
  const outcome = climbOutcome(climb);
  const sent = outcome.kind === "send";
  const sends = known?.sends ?? 0;

  const apply = (next: ClimbDraft, isSent: boolean, style: FirstGoStyle): void => {
    onChange(withClimbOutcome(next, resultOutcome(discipline, isSent, next.tries, style)));
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "rgba(64,63,76,0.15)",
        borderRadius: radius.control,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={tap(() => apply(climb, !sent, firstGo))}
        accessibilityRole="switch"
        accessibilityState={{ checked: sent }}
        accessibilityLabel={t("common.sent")}
        style={pressRow({ ...row, gap: 12, minHeight: 64, borderTopWidth: 0 })}
      >
        <Mark outcome={outcome} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}>
            {sent ? sendStyleLabel(discipline, outcome.style) : t("logSession.attempt")}
          </Text>
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              letterSpacing: 0.4,
              color: colors.textMuted,
            }}
          >
            {sends === 0 ? t("logSession.noSendsYet") : t("logSession.sendCount", { count: sends })}
          </Text>
        </View>
        <Text style={label}>{t("common.sent")}</Text>
        <Switch
          value={sent}
          onValueChange={(value) => apply(climb, value, firstGo)}
          trackColor={{ true: colors.azureInk, false: "rgba(64,63,76,0.22)" }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </Pressable>

      <View style={{ ...row, minHeight: 56, paddingLeft: 52, gap: 6 }}>
        <Text style={{ ...label, flex: 1 }}>{t("logSession.tries")}</Text>
        <StepButton
          glyph="−"
          disabled={climb.tries <= 1}
          onPress={() => apply(withTries(climb, climb.tries - 1), sent, firstGo)}
        />
        <Text
          style={{
            width: 24,
            textAlign: "center",
            fontFamily: fonts.monoSemiBold,
            fontSize: 15,
            color: colors.gunmetal,
          }}
        >
          {climb.tries}
        </Text>
        <StepButton
          glyph="+"
          disabled={climb.tries >= 99}
          onPress={() => apply(withTries(climb, climb.tries + 1), sent, firstGo)}
        />
      </View>

      {discipline === "route" && sent && climb.tries === 1 && (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t("logSession.sendStyle")}
          style={{ ...row, minHeight: 56, paddingLeft: 52, gap: 20 }}
        >
          {FIRST_GO_STYLES.map((style) => (
            <StyleRadio
              key={style}
              style={style}
              checked={outcome.style === style}
              onPress={() => {
                setFirstGo(style);
                apply(climb, true, style);
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
