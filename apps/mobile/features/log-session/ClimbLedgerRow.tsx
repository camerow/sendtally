import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  enduranceLapCountLabel,
  enduranceOf,
  enduranceSummaryLabel,
  type ClimbDraft,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { CircuitDot } from "../../components/CircuitDot";
import { Icon } from "../../components/Icon";
import { press, pressRow, tap } from "../../lib/press";

export type ClimbLedgerRowProps = {
  climb: ClimbDraft;
  project: boolean;
  onPress: () => void;
  /** Given by the live card: tries change in place, without opening the editor. */
  onChangeTries?: (tries: number) => void;
  /** Given by the live card: the mark flips sent and attempt without opening the editor. */
  onToggleSent?: () => void;
};

function Stepper({
  glyph,
  disabled,
  label,
  onPress,
}: {
  glyph: string;
  disabled: boolean;
  label: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={tap(onPress)}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={press({
        width: 30,
        height: 30,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(64,63,76,0.18)",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.35 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.monoMedium, fontSize: 15, color: colors.gunmetal }}>
        {glyph}
      </Text>
    </Pressable>
  );
}

function ResultMark({ send, firstGo }: { send: boolean; firstGo: boolean }): React.ReactElement {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        flexShrink: 0,
        borderRadius: 11,
        backgroundColor: firstGo ? colors.gold : send ? colors.azureInk : colors.gunmetal,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{ fontSize: 12, fontWeight: "600", color: firstGo ? colors.gunmetal : colors.white }}
      >
        {send ? "✓" : "✗"}
      </Text>
    </View>
  );
}

/** A circuit of laps has no result badge and no try count: the laps themselves are the record. */
function EnduranceLedgerRow({
  climb,
  onPress,
}: {
  climb: ClimbDraft;
  onPress: () => void;
}): React.ReactElement {
  const endurance = enduranceOf(climb);
  const named = climb.name.trim() !== "";
  const meta = `${enduranceLapCountLabel(endurance.laps.length)} · ${enduranceSummaryLabel(endurance)}`;
  return (
    <Pressable
      onPress={tap(onPress)}
      accessibilityRole="button"
      accessibilityLabel={`${named ? climb.name : t("endurance.title")}, ${climb.grade}, ${meta}`}
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minHeight: 58,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <Icon name="endurance" color={colors.petalInk} size={16} strokeWidth={2.4} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: named ? fonts.sansSemiBold : fonts.sans,
            fontSize: 15,
            color: named ? colors.gunmetal : colors.textFaint,
          }}
        >
          {named ? climb.name : t("endurance.title")}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 11,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: colors.textMuted,
          }}
        >
          {meta}
        </Text>
      </View>
      <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 14, color: colors.gunmetal }}>
        {climb.grade}
      </Text>
      <Icon name="chevron" color={colors.textFaint} size={16} />
    </Pressable>
  );
}

export function ClimbLedgerRow({
  climb,
  project,
  onPress,
  onChangeTries,
  onToggleSent,
}: ClimbLedgerRowProps): React.ReactElement {
  if (climb.endurance !== undefined)
    return <EnduranceLedgerRow climb={climb} onPress={tap(onPress)} />;
  const named = climb.name.trim() !== "";
  const send = climb.kind === "send";
  const circuit = climb.circuit;
  const title = named
    ? climb.name
    : circuit === undefined
      ? t("logSession.unnamed")
      : circuit.label;
  const firstGo = send && climb.style !== "redpoint";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("logSession.ledgerLabel", {
        grade: circuit === undefined ? climb.grade : `${circuit.label} ${climb.grade}`,
        name: [title, ...(climb.wall === undefined || climb.wall === "" ? [] : [climb.wall])].join(
          " · "
        ),
        kind: send ? t("logSession.sendLower") : t("logSession.attemptKind"),
        tries: t("logSession.triesCount", { count: climb.tries }),
      })}
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        height: 52,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      {circuit === undefined ? (
        <View
          style={{
            minWidth: 44,
            height: 32,
            flexShrink: 0,
            paddingHorizontal: 9,
            borderRadius: 8,
            backgroundColor: colors.surfaceSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 14, color: colors.gunmetal }}>
            {climb.grade}
          </Text>
        </View>
      ) : (
        <CircuitDot colour={circuit.colour} />
      )}
      <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 }}>
        {project && <Icon name="projects" color={colors.gunmetal} size={14} strokeWidth={2} />}
        <View style={{ flexShrink: 1, gap: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: named || circuit !== undefined ? fonts.sansSemiBold : fonts.sans,
              fontSize: 15,
              color: named || circuit !== undefined ? colors.gunmetal : colors.textFaint,
            }}
          >
            {title}
          </Text>
          {climb.wall !== undefined && climb.wall !== "" && (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 10,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.textMuted,
              }}
            >
              {climb.wall}
            </Text>
          )}
        </View>
      </View>
      {onToggleSent === undefined ? (
        <ResultMark send={send} firstGo={firstGo} />
      ) : (
        <Pressable
          onPress={tap(onToggleSent)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            send ? t("logSession.sentTapToAttempt") : t("logSession.attemptTapToSent")
          }
          style={press({ flexShrink: 0 })}
        >
          <ResultMark send={send} firstGo={firstGo} />
        </Pressable>
      )}
      {onChangeTries === undefined ? (
        <Text
          style={{
            width: 30,
            flexShrink: 0,
            textAlign: "right",
            fontFamily: fonts.monoMedium,
            fontSize: 13,
            color: colors.textMuted,
          }}
        >
          ×{climb.tries}
        </Text>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Stepper
            glyph="−"
            disabled={climb.tries <= 1}
            label={t("logSession.fewerTries")}
            onPress={() => onChangeTries(climb.tries - 1)}
          />
          <Text
            style={{
              width: 30,
              textAlign: "center",
              fontFamily: fonts.monoSemiBold,
              fontSize: 13,
              color: colors.gunmetal,
            }}
          >
            ×{climb.tries}
          </Text>
          <Stepper
            glyph="+"
            disabled={climb.tries >= 99}
            label={t("logSession.moreTries")}
            onPress={() => onChangeTries(climb.tries + 1)}
          />
        </View>
      )}
      <Icon name="chevron" color={colors.textFaint} size={16} />
    </Pressable>
  );
}
