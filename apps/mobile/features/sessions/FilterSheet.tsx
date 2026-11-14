import React from "react";
import { Pressable, Text, View } from "react-native";
import { logCountLabel } from "@sendtally/features/sessions";
import {
  LOG_SCOPES,
  logScopeItems,
  logScopeLabel,
  type LogItem,
  type LogScope,
} from "@sendtally/features/journal";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { Sheet } from "../../components/Sheet";
import { press } from "../../lib/press";

export type SessionFilters = { scope: LogScope };

export const DEFAULT_FILTERS: SessionFilters = { scope: "all" };

export type FilterSheetProps = {
  visible: boolean;
  items: LogItem[];
  filters: SessionFilters;
  onApply: (filters: SessionFilters) => void;
  onClose: () => void;
};

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  lineHeight: 13,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textMuted,
} as const;

export function FilterSheet({
  visible,
  items,
  filters,
  onApply,
  onClose,
}: FilterSheetProps): React.ReactElement {
  const [draft, setDraft] = React.useState<SessionFilters>(filters);

  // The sheet stays mounted so the Modal can animate, so opening it is what
  // resets the draft back to what the screen is actually filtered by.
  const [wasVisible, setWasVisible] = React.useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(filters);
  }

  const count = logScopeItems(items, draft.scope);

  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("common.closeFilters")}>
      <View style={{ gap: 18, paddingTop: 2, paddingHorizontal: 18, paddingBottom: 18 }}>
        <View
          style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}
        >
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 22,
              letterSpacing: -0.5,
              color: colors.gunmetal,
            }}
          >
            {t("common.filters")}
          </Text>
          <Pressable
            onPress={() => setDraft(DEFAULT_FILTERS)}
            accessibilityRole="button"
            hitSlop={8}
            style={press({})}
          >
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 11,
                letterSpacing: 0.66,
                textTransform: "uppercase",
                color: colors.azureInk,
              }}
            >
              {t("common.clear")}
            </Text>
          </Pressable>
        </View>
        <View style={{ gap: 9 }}>
          <Text style={label}>{t("journal.show")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {LOG_SCOPES.map((value) => (
              <Chip
                key={value}
                label={logScopeLabel(value)}
                active={draft.scope === value}
                onPress={() => setDraft({ scope: value })}
              />
            ))}
          </View>
        </View>
        <Pressable
          onPress={() => onApply(draft)}
          accessibilityRole="button"
          style={press({
            height: 48,
            marginTop: 4,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.control,
            backgroundColor: colors.azureInk,
          })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
            {t("sessions.showCount", { label: logCountLabel(count).toLowerCase() })}
          </Text>
        </Pressable>
      </View>
    </Sheet>
  );
}
