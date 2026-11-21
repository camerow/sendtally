import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  ambiguousDateText,
  columnChoices,
  matchRows,
  sheetMeta,
  unusedText,
  withColumn,
  withWhereKind,
  type ColumnsReview,
  type MatchRow,
} from "@sendtally/features/import";
import { firstRunSourceLabel } from "@sendtally/features/settings";
import { Segmented } from "../../components/Segmented";
import { bodyText } from "../../lib/styles";
import { AMBER } from "../training/components/tints";
import { type } from "../training/type";
import { ImportHero } from "./ImportHero";
import { MatchFieldRow } from "./MatchFieldRow";

/** H2s: how a spreadsheet's columns map to ours, each one editable, before the review. */
export function ColumnMatch({
  review,
  onChange,
}: {
  review: ColumnsReview;
  onChange: (review: ColumnsReview) => void;
}): React.ReactElement {
  const ambiguous = ambiguousDateText(review);
  const unused = unusedText(review);
  const where = review.match.where;
  const extra = (row: MatchRow): React.ReactNode => {
    if (row.field === "date" && ambiguous !== null)
      return (
        <View style={{ gap: 6 }}>
          <Text style={[type.mono, { fontSize: 12, color: AMBER }]}>{ambiguous}</Text>
          <Segmented
            soft
            label={t("import.match.dateOrder")}
            segments={(["dmy", "mdy"] as const).map((order) => ({
              key: order,
              label: t(order === "dmy" ? "import.match.dayFirst" : "import.match.monthFirst"),
              on: review.order === order,
              onPress: () => onChange({ ...review, order }),
            }))}
          />
        </View>
      );
    if (row.field === "where" && where !== null)
      return (
        <Segmented
          soft
          label={row.label}
          segments={(["gym", "crag"] as const).map((kind) => ({
            key: kind,
            label: t(kind === "gym" ? "import.match.gym" : "import.match.crag"),
            on: where.kind === kind,
            onPress: () => onChange(withWhereKind(review, kind)),
          }))}
        />
      );
    return null;
  };
  return (
    <>
      <ImportHero
        kicker={firstRunSourceLabel("spreadsheet")}
        kickerColor={colors.azureInk}
        title={t("import.match.title")}
        meta={sheetMeta(review)}
      />
      <Text style={bodyText}>{t("import.match.check")}</Text>
      <View>
        {matchRows(review).map((row) => (
          <MatchFieldRow
            key={row.field}
            row={row}
            columns={columnChoices(review)}
            onPick={(column) => onChange(withColumn(review, row.field, column))}
          >
            {extra(row)}
          </MatchFieldRow>
        ))}
      </View>
      {unused !== null && (
        <Text style={{ ...bodyText, fontSize: 12.5, color: colors.textSecondary }}>{unused}</Text>
      )}
    </>
  );
}
