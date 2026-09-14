import { router, useFocusEffect } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { parseStoredDraft, type StoredSessionDraft } from "@sendtally/features/log-session";
import { formatDate, t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { confirmDiscardDraft } from "../log-session/confirmDiscardDraft";
import { press, pressRow } from "../../lib/press";
import { DayColumn, RowTitle } from "./SessionRowParts";
import { sessionDraftStorage } from "../../lib/sessionDraftStorage";

const read = (): StoredSessionDraft | null =>
  parseStoredDraft(sessionDraftStorage.read(), new Date());

export function DraftSessionRow(): React.ReactElement | null {
  const [stored, setStored] = React.useState(read);
  // The draft is written by the form, on another screen. A store notification reaching a
  // blurred tab is not something to depend on - the tab regaining focus is, and it is the
  // only moment this row can need to change.
  useFocusEffect(
    React.useCallback(() => {
      setStored(read());
    }, [])
  );

  const discard = (): void => {
    sessionDraftStorage.remove();
    setStored(null);
  };

  if (stored === null) return null;

  const { draft, savedAt } = stored;
  const meta = t("logSession.draftMetaShort", {
    climbs: t("common.climbCount", { count: draft.climbs.length }),
    start: draft.startTime,
    end: draft.endTime,
  });

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 18,
        backgroundColor: "rgba(249,220,92,0.16)",
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <Pressable
        onPress={() => router.push("/session/new")}
        accessibilityRole="button"
        accessibilityLabel={`${t("sessions.unfinishedSession")}, ${meta}, ${t("sessions.resume")}`}
        style={pressRow({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 11,
          paddingLeft: 18,
          paddingRight: 12,
        })}
      >
        <DayColumn
          weekday={formatDate(savedAt, { weekday: "short" })}
          day={formatDate(savedAt, { day: "numeric" })}
        />
        <View style={{ flex: 1, gap: 3 }}>
          <RowTitle title={t("sessions.unfinishedSession")} meta={meta} />
        </View>
      </Pressable>
      <Pressable
        onPress={() => confirmDiscardDraft(stored, discard)}
        accessibilityRole="button"
        accessibilityLabel={t("common.discard")}
        hitSlop={8}
        style={press({
          minHeight: 32,
          paddingHorizontal: 12,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.control,
          borderWidth: 1,
          borderColor: "rgba(64,63,76,0.28)",
        })}
      >
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.gunmetal }}>
          {t("common.discard")}
        </Text>
      </Pressable>
    </View>
  );
}
