import type React from "react";
import { t } from "@sendtally/features/i18n";
import {
  ambiguousDateText,
  columnChoices,
  matchRows,
  unusedText,
  withColumn,
  withWhereKind,
  type ColumnsReview,
  type MatchRow,
} from "@sendtally/features/import";
import { Segmented } from "../../components/Segmented";
import { bodyText } from "../../settings/components/styles";
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
        <>
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--warning-amber)" }}
          >
            {ambiguous}
          </span>
          <Segmented
            soft
            label={t("import.match.dateOrder")}
            value={review.order}
            onChange={(order) => onChange({ ...review, order })}
            options={[
              { value: "dmy", label: t("import.match.dayFirst") },
              { value: "mdy", label: t("import.match.monthFirst") },
            ]}
          />
        </>
      );
    if (row.field === "where" && where !== null)
      return (
        <Segmented
          soft
          label={row.label}
          value={where.kind}
          onChange={(kind) => onChange(withWhereKind(review, kind))}
          options={[
            { value: "gym", label: t("import.match.gym") },
            { value: "crag", label: t("import.match.crag") },
          ]}
        />
      );
    return null;
  };
  return (
    <>
      <p style={{ ...bodyText, fontSize: 15, lineHeight: "22px" }}>{t("import.match.check")}</p>
      <div>
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
      </div>
      {unused !== null && <p style={bodyText}>{unused}</p>}
    </>
  );
}
