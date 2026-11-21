import type { SendtallyApi } from "@sendtally/api-client";
import { disciplineOf } from "@sendtally/core";
import {
  ambiguousDate,
  dateIn,
  dateOrderOf,
  firstValue,
  matchSample,
  planMatched,
  sheetOf,
  unusedColumns,
  usedColumns,
  type ClimbResult,
  type ColumnMatch,
  type DateOrder,
  type ImportPlan,
  type Sheet,
} from "@sendtally/core/import";
import { formatDate, t, type MessageKey } from "../i18n";

export type MatchField =
  "date" | "climb" | "grade" | "otherGrade" | "result" | "tries" | "where" | "notes";

/** H2s: a spreadsheet's columns as the model matched them, and the user's edits. */
export type ColumnsReview = {
  fileName: string;
  sheet: Sheet;
  suggested: ColumnMatch;
  match: ColumnMatch;
  order: DateOrder;
  /** The file's dates could be day or month first, so the screen asks. */
  ask: boolean;
};

/** The model's match of a file no export format reads, or null to fall back to the prompt. */
export async function requestColumns(
  api: Pick<SendtallyApi, "matchColumns">,
  text: string,
  fileName: string
): Promise<ColumnsReview | null> {
  const sheet = sheetOf(text);
  if (sheet === null) return null;
  const answer = await api.matchColumns(matchSample(sheet)).catch(() => ({ match: null }));
  if (answer.match === null) return null;
  return withDates({
    fileName,
    sheet,
    suggested: answer.match,
    match: answer.match,
    order: "dmy",
    ask: false,
  });
}

function withDates(review: ColumnsReview): ColumnsReview {
  const settled = dateOrderOf(review.sheet, review.match.date);
  return {
    ...review,
    ask: settled === "ask",
    order: settled === "mdy" || settled === "dmy" ? settled : review.order,
  };
}

const FIELDS: MatchField[] = [
  "date",
  "climb",
  "grade",
  "otherGrade",
  "result",
  "tries",
  "where",
  "notes",
];

const columnOf = (match: ColumnMatch, field: MatchField): string | null => {
  const value = match[field];
  return value === null ? null : typeof value === "string" ? value : value.column;
};

export function withColumn(
  review: ColumnsReview,
  field: MatchField,
  column: string | null
): ColumnsReview {
  const { match, suggested } = review;
  const value =
    column !== null && columnOf(suggested, field) === column
      ? suggested[field]
      : column === null
        ? null
        : field === "grade" || field === "otherGrade"
          ? { column, scale: null }
          : field === "result"
            ? { column, values: [] }
            : field === "where"
              ? { column, kind: match.where?.kind ?? "crag" }
              : column;
  if (value === null && (field === "date" || field === "grade")) return review;
  const next = { ...review, match: { ...match, [field]: value } as ColumnMatch };
  return field === "date" ? withDates(next) : next;
}

export const withWhereKind = (review: ColumnsReview, kind: "gym" | "crag"): ColumnsReview =>
  review.match.where === null
    ? review
    : { ...review, match: { ...review.match, where: { ...review.match.where, kind } } };

export type MatchRow = {
  field: MatchField;
  label: string;
  column: string | null;
  sample: string;
  /** Date and grade cannot be left out; every other field can be None. */
  required: boolean;
};

const MEANS = {
  send: "import.match.meansSend",
  attempt: "import.match.meansAttempt",
  flash: "import.match.meansFlash",
  onsight: "import.match.meansOnsight",
  redpoint: "import.match.meansRedpoint",
} as const satisfies Record<ClimbResult, MessageKey>;

const gradeLabel = (match: ColumnMatch, field: "grade" | "otherGrade"): string => {
  const scale = match[field]?.scale;
  if (match.otherGrade === null || scale == null) return t("import.match.grade");
  return disciplineOf(scale) === "boulder"
    ? t("import.match.boulderGrade")
    : t("import.match.routeGrade");
};

function sampleOf(review: ColumnsReview, field: MatchField, column: string): string {
  const { result } = review.match;
  if (field === "result" && result !== null && result.values.length > 0)
    return result.values
      .slice(0, 3)
      .map((v) => t("import.match.means", { value: v.value, means: t(MEANS[v.means]) }))
      .join(" · ");
  return firstValue(review.sheet, column) ?? "";
}

const LABELS = {
  date: "import.match.date",
  climb: "import.match.climb",
  result: "import.match.result",
  tries: "import.match.tries",
  where: "import.match.where",
  notes: "import.match.notes",
} as const satisfies Record<Exclude<MatchField, "grade" | "otherGrade">, MessageKey>;

/** One row per field, in the screen's order; a second grade shows only when there is one. */
export function matchRows(review: ColumnsReview): MatchRow[] {
  return FIELDS.filter((f) => f !== "otherGrade" || review.match.otherGrade !== null).map(
    (field) => {
      const column = columnOf(review.match, field);
      return {
        field,
        label:
          field === "grade" || field === "otherGrade"
            ? gradeLabel(review.match, field)
            : t(LABELS[field]),
        column,
        sample: column === null ? "" : sampleOf(review, field, column),
        required: field === "date" || field === "grade",
      };
    }
  );
}

/** The sheet's columns a field can take, as the picker lists them. */
export const columnChoices = (review: ColumnsReview): string[] =>
  review.sheet.header.filter((h) => h !== "");

export const unusedText = (review: ColumnsReview): string | null => {
  const unused = unusedColumns(review.sheet, review.match);
  return unused.length === 0 ? null : t("import.match.unused", { columns: unused.join(", ") });
};

export const sheetMeta = (review: ColumnsReview): string =>
  [
    review.fileName,
    t("import.match.rows", { count: review.sheet.rows.length }),
    t("import.match.columns", { count: columnChoices(review).length }),
  ].join(" · ");

const dayMonth = (iso: string): string =>
  formatDate(new Date(`${iso}T00:00:00Z`), { timeZone: "UTC", day: "numeric", month: "long" });

/** "03/04/22 could be 3 April or 4 March.", or null when the file's dates settle it. */
export function ambiguousDateText(review: ColumnsReview): string | null {
  const date = review.ask ? ambiguousDate(review.sheet, review.match.date) : undefined;
  if (date === undefined) return null;
  return t("import.match.ambiguous", {
    date,
    dayFirst: dayMonth(dateIn(date, "dmy")),
    monthFirst: dayMonth(dateIn(date, "mdy")),
  });
}

/** The whole file read through the approved match, ready for the review. */
export const matchedPlan = (review: ColumnsReview, timeZone: string): ImportPlan =>
  planMatched(review.sheet, review.match, review.order, timeZone);

export function columnsMatchedEvent(
  review: ColumnsReview,
  outcome: "matched" | "fallback"
): {
  columns: number;
  matched: number;
  asked: number;
  edited: number;
  outcome: "matched" | "fallback";
} {
  return {
    columns: columnChoices(review).length,
    matched: usedColumns(review.match).length,
    asked: review.ask ? 1 : 0,
    edited: FIELDS.filter((f) => columnOf(review.match, f) !== columnOf(review.suggested, f))
      .length,
    outcome,
  };
}
