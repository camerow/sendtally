import React from "react";
import { Pressable, Text, View } from "react-native";
import type { JournalEntry, SessionRow as SessionRowData } from "@sendtally/api-client";
import {
  entryKindLabel,
  entryTitle,
  spanLabel,
  tripDays,
  tripEffort,
  type LogItem,
} from "@sendtally/features/journal";
import {
  logCountLabel,
  sessionTitle,
  sessionTotals,
  sessionsIn,
} from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press } from "../../lib/press";
import { EntryRow, entryRowHeight } from "./EntryRow";
import { EntryKindChip } from "./EntryKindChip";
import { SessionRow, sessionRowHeight } from "../sessions/SessionRow";
import { ROW_TAGS_HEIGHT, RowTags } from "../sessions/RowTags";

type TripItem = Extract<LogItem, { type: "entry" }>;

const CARD_MARGIN = 10;
/** Padding, the chip line, the title, the meta and the 3px gaps between them. */
const HEADER_HEIGHT = 85;
/** Past this many days the strip is wider than the title it sits beside. */
const MAX_DOTS = 12;
const ROW_PADDING = 14;
const TINT = "rgba(204,121,234,0.13)";

const innerHeight = (item: LogItem): number =>
  item.type === "session" ? sessionRowHeight(item.session) : entryRowHeight(item.entry);

export function tripGroupHeight(item: TripItem): number {
  // Card margins, both borders, the header and its rule, less the last row's dropped hairline.
  return (
    CARD_MARGIN * 2 +
    3 +
    HEADER_HEIGHT +
    (item.entry.tags.length > 0 ? ROW_TAGS_HEIGHT : 0) +
    item.inside.reduce((sum, inner) => sum + innerHeight(inner), 0) -
    1
  );
}

const sessionsOf = (items: LogItem[]): SessionRowData[] =>
  items.flatMap((i) => (i.type === "session" ? [i.session] : []));

/** What the trip holds and the hardest thing in it - the duration would not fit beside them. */
const tripMeta = (inside: LogItem[]): string => {
  const totals = sessionTotals(sessionsIn(inside));
  if (totals.topGrade < 0) return logCountLabel(inside);
  const grade = t("sessions.topGrade", { grade: totals.topGradeLabel ?? `V${totals.topGrade}` });
  return `${logCountLabel(inside)} · ${grade}`;
};

const entriesOf = (items: LogItem[]): JournalEntry[] =>
  items.flatMap((i) => (i.type === "entry" ? [i.entry] : []));

/** The hardest RPE of each day of the trip, a dash of a day nobody climbed. */
function EffortDots({ trip, inside }: { trip: JournalEntry; inside: LogItem[] }): React.ReactNode {
  const effort = tripEffort(tripDays(trip, sessionsOf(inside), entriesOf(inside)));
  if (effort.length > MAX_DOTS || !effort.some((rpe) => rpe !== null)) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 22 }}>
      {effort.map((rpe, i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: rpe === null ? 6 : 6 + rpe * 1.6,
            borderRadius: 3,
            backgroundColor:
              rpe === null ? colors.dataBarEmpty : rpe >= 8 ? colors.petalInk : colors.petal,
          }}
        />
      ))}
    </View>
  );
}

/** A trip and everything logged inside its dates, held in one card. */
export function TripGroup({
  item,
  onOpen,
}: {
  item: TripItem;
  onOpen: (item: LogItem) => void;
}): React.ReactElement {
  const last = item.inside.length - 1;
  return (
    <View
      style={{
        marginVertical: CARD_MARGIN,
        marginHorizontal: 18,
        borderWidth: 1,
        borderColor: colors.petalTint,
        borderRadius: radius.cardLg,
        overflow: "hidden",
        backgroundColor: colors.white,
      }}
    >
      <Pressable
        onPress={() => onOpen(item)}
        accessibilityRole="button"
        accessibilityLabel={[
          entryKindLabel("trip"),
          entryTitle(item.entry),
          spanLabel(item.entry.occurred_at, item.entry.ends_at),
          tripMeta(item.inside),
        ].join(", ")}
        style={press({
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: ROW_PADDING,
          borderBottomWidth: 1,
          borderBottomColor: colors.petalTint,
          backgroundColor: TINT,
        })}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <EntryKindChip kind="trip" bg={colors.white} />
            <Text
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontFamily: fonts.monoMedium,
                fontSize: 10,
                lineHeight: 13,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: colors.petalInk,
              }}
            >
              {spanLabel(item.entry.occurred_at, item.entry.ends_at)}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.display,
              fontSize: 18,
              lineHeight: 21,
              letterSpacing: -0.3,
              color: colors.gunmetal,
            }}
          >
            {entryTitle(item.entry)}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              lineHeight: 14,
              color: colors.textSecondary,
            }}
          >
            {tripMeta(item.inside)}
          </Text>
          <RowTags tags={item.entry.tags} />
        </View>
        <EffortDots trip={item.entry} inside={item.inside} />
        <Icon name="chevron" size={12} strokeWidth={2} color="rgba(64,63,76,0.35)" />
      </Pressable>
      {item.inside.map((inner, n) => (
        <View key={inner.key} style={{ paddingHorizontal: ROW_PADDING }}>
          {inner.type === "session" ? (
            <SessionRow
              session={inner.session}
              title={sessionTitle(inner.session)}
              inset
              divider={n < last}
              onPress={() => onOpen(inner)}
            />
          ) : (
            <EntryRow entry={inner.entry} inset divider={n < last} onPress={() => onOpen(inner)} />
          )}
        </View>
      ))}
    </View>
  );
}
