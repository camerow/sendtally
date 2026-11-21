import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { MatchRow } from "@sendtally/features/import";
import { Icon } from "../../components/Icon";
import { OptionRow } from "../../components/OptionRow";
import { Sheet } from "../../components/Sheet";
import { pressRow } from "../../lib/press";
import { Label } from "../training/components/Label";
import { type } from "../training/type";

/** One of our fields, the sheet's column that holds it and a sample; pressing it picks another column. */
export function MatchFieldRow({
  row,
  columns,
  onPick,
  children,
}: {
  row: MatchRow;
  columns: string[];
  onPick: (column: string | null) => void;
  children?: React.ReactNode;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const pick = (column: string | null): void => {
    setOpen(false);
    onPick(column);
  };
  const column = row.column ?? t("import.match.none");
  return (
    <View
      style={{
        gap: 6,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${row.label}, ${column}`}
        style={pressRow({ flexDirection: "row", alignItems: "center", gap: 10 })}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Label small color={colors.textSecondary}>
            {row.label}
          </Label>
          <Text
            style={{
              fontFamily: row.column === null ? fonts.sans : fonts.sansSemiBold,
              fontSize: 15,
              color: row.column === null ? colors.textMuted : colors.gunmetal,
            }}
          >
            {column}
          </Text>
          {row.sample !== "" && (
            <Text
              numberOfLines={1}
              style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}
            >
              {row.sample}
            </Text>
          )}
        </View>
        <View style={{ transform: [{ rotate: "90deg" }] }}>
          <Icon name="chevron" color={colors.textMuted} size={16} strokeWidth={2} />
        </View>
      </Pressable>
      {children}
      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        closeLabel={t("common.closeOptions", { label: row.label })}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
          <Label small color={colors.textSecondary} style={{ marginBottom: 6 }}>
            {row.label}
          </Label>
          {!row.required && (
            <OptionRow
              label={t("import.match.noneOption")}
              mono={false}
              selected={row.column === null}
              onPress={() => pick(null)}
            />
          )}
          {columns.map((c) => (
            <OptionRow
              key={c}
              label={c}
              mono={false}
              selected={row.column === c}
              onPress={() => pick(c)}
            />
          ))}
        </View>
      </Sheet>
    </View>
  );
}
