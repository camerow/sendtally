import React from "react";
import { Pressable, Text, View } from "react-native";
import type { SessionRow as SessionRowData } from "@sendtally/api-client";
import { formatDate, t } from "@sendtally/features/i18n";
import { isoDay } from "@sendtally/features/journal";
import { sessionTitle } from "@sendtally/features/sessions";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { press, pressRow } from "../../lib/press";
import { SessionRow } from "../sessions/SessionRow";

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

const optionLabel = (session: SessionRowData): string => {
  const day = formatDate(new Date(session.start_at), {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `${day} · ${sessionTitle(session)}`;
};

function Option({
  session,
  onPress,
}: {
  session: SessionRowData;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={pressRow({
        minHeight: 48,
        justifyContent: "center",
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.gunmetal }}>
        {optionLabel(session)}
      </Text>
    </Pressable>
  );
}

/**
 * Adding a session opens the sheet the grade picker uses. What is already
 * linked sits underneath as log rows, because a session should look the same
 * wherever it is listed. A trip is several days of climbing, so this is a list.
 */
export function SessionPicker({
  sessions,
  occurredAt,
  endsAt,
  value,
  onChange,
}: {
  sessions: SessionRowData[];
  occurredAt: string;
  endsAt: string;
  value: string[];
  onChange: (fingerprints: string[]) => void;
}): React.ReactElement | null {
  const [open, setOpen] = React.useState(false);
  const linked = sessions
    .filter((s) => value.includes(s.fingerprint))
    .sort((a, b) => b.start_at.localeCompare(a.start_at));
  const available = sessions
    .filter((s) => !value.includes(s.fingerprint))
    .sort((a, b) => b.start_at.localeCompare(a.start_at));

  if (sessions.length === 0) return null;

  const to = endsAt === "" ? occurredAt : endsAt;
  const inSpan = available.filter((s) => {
    const day = isoDay(s.start_at);
    return day >= occurredAt && day <= to;
  });
  const rest = available.filter((s) => !inSpan.includes(s));
  const pick = (fingerprint: string): void => {
    onChange([...value, fingerprint]);
    setOpen(false);
  };

  return (
    <View style={{ gap: 10 }}>
      <Text style={label}>{t("journal.sessions")}</Text>
      {available.length > 0 && (
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          style={press({
            height: 46,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 13,
            borderRadius: radius.control,
            borderWidth: 1,
            borderColor: colors.lineOnLightStrong,
          })}
        >
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.textFaint }}>
            {value.length === 0 ? t("journal.linkASession") : t("journal.linkAnother")}
          </Text>
          <View style={{ transform: [{ rotate: "90deg" }] }}>
            <Icon name="chevron" color={colors.textMuted} size={16} strokeWidth={2} />
          </View>
        </Pressable>
      )}
      {linked.length > 0 && (
        <View style={{ marginHorizontal: -18 }}>
          {linked.map((session) => (
            <SessionRow
              key={session.fingerprint}
              session={session}
              title={sessionTitle(session)}
              onPress={() => undefined}
              trailing={
                <Pressable
                  onPress={() => onChange(value.filter((f) => f !== session.fingerprint))}
                  accessibilityRole="button"
                  accessibilityLabel={t("journal.unlinkSession")}
                  hitSlop={8}
                  style={press({
                    width: 24,
                    height: 24,
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                >
                  <Text style={{ fontFamily: fonts.mono, fontSize: 14, color: colors.textMuted }}>
                    ✕
                  </Text>
                </Pressable>
              }
            />
          ))}
        </View>
      )}
      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        closeLabel={t("common.closeOptions", { label: t("journal.sessions") })}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
          {inSpan.length > 0 && (
            <>
              <Text style={{ ...label, marginBottom: 6 }}>{t("journal.theseDates")}</Text>
              {inSpan.map((s) => (
                <Option key={s.fingerprint} session={s} onPress={() => pick(s.fingerprint)} />
              ))}
            </>
          )}
          {rest.length > 0 && (
            <>
              <Text style={{ ...label, marginTop: inSpan.length > 0 ? 16 : 0, marginBottom: 6 }}>
                {t("journal.recent")}
              </Text>
              {rest.map((s) => (
                <Option key={s.fingerprint} session={s} onPress={() => pick(s.fingerprint)} />
              ))}
            </>
          )}
        </View>
      </Sheet>
    </View>
  );
}
