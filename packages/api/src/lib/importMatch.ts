import {
  MATCH_CELL_MAX,
  MATCH_MAX_COLUMNS,
  MATCH_SAMPLE_ROWS,
  sampleFits,
  toCsv,
  type ColumnMatch,
} from "@sendtally/core/import";
import { z } from "zod";

export const MATCH_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const MATCHES_PER_DAY = 20;

const cells = z.array(z.string().max(MATCH_CELL_MAX)).max(MATCH_MAX_COLUMNS);

export const matchBody = z
  .object({ header: cells.min(1), rows: z.array(cells).max(MATCH_SAMPLE_ROWS) })
  .refine((body) => sampleFits(body.header, body.rows), "sample too large");

export type MatchBody = z.infer<typeof matchBody>;

const column = z.string().nullable();
const scale = z.enum(["v", "font", "yds", "french"]).nullable();

// Flat on purpose: a nested object used twice becomes a $ref, which the model does not follow.
const answer = z.object({
  date: column,
  climb: column,
  grade: column,
  gradeScale: scale,
  otherGrade: column,
  otherGradeScale: scale,
  result: column,
  resultValues: z.array(
    z.object({
      value: z.string(),
      means: z.enum(["send", "attempt", "flash", "onsight", "redpoint"]),
    })
  ),
  tries: column,
  where: column,
  whereKind: z.enum(["gym", "crag"]).nullable(),
  notes: column,
});

const { $schema: _, ...answerSchema } = z.toJSONSchema(answer);

export const matchPrompt = (body: MatchBody): { role: "system" | "user"; content: string }[] => [
  {
    role: "system",
    content: `You match the columns of a climbing log spreadsheet to a climbing app's fields. You get the header and the first rows as CSV. Answer with the column holding each field, using the header name exactly as written, or null when no column holds it. Never invent a column.
- date: the day of the climb.
- grade: the grade of the climb. When boulder and route grades are in separate columns, grade is one and otherGrade the other; otherwise otherGrade is null.
- gradeScale and otherGradeScale: the grade system that column is written in: "v" (V4, or bare numbers in a V column), "font" (6A+), "yds" (5.11b, or 11b without the 5.), "french" (7a), or null if unsure.
- climb: the climb's name. tries: the number of attempts. notes: free text about the climb.
- where: the gym or crag. whereKind: "gym" for an indoor gym, "crag" for outdoor climbing.
- result: the column saying whether the climb was sent. resultValues: every distinct value of that column in the rows, each mapped to send, attempt (not topped: fell, project, no, n), flash, onsight or redpoint.
If the sheet is not a log of climbs with a date and a grade, answer null for date and grade.`,
  },
  { role: "user", content: toCsv([body.header, ...body.rows]) },
];

export const responseFormat = { type: "json_schema" as const, json_schema: answerSchema };

// The model's answer as a match on this header: "no_match" when it found no date or grade,
// null when it named a column the sheet does not have or did not answer in the schema.
export function matchOf(output: unknown, header: string[]): ColumnMatch | "no_match" | null {
  const parsed = answer.safeParse(typeof output === "string" ? safeJson(output) : output);
  if (!parsed.success) return null;
  const a = parsed.data;
  if (a.date === null || a.grade === null) return "no_match";
  const named = [a.date, a.climb, a.grade, a.otherGrade, a.result, a.tries, a.where, a.notes];
  if (!named.every((c) => c === null || header.includes(c))) return null;
  return {
    date: a.date,
    climb: a.climb,
    grade: { column: a.grade, scale: a.gradeScale },
    otherGrade: a.otherGrade === null ? null : { column: a.otherGrade, scale: a.otherGradeScale },
    result: a.result === null ? null : { column: a.result, values: a.resultValues },
    tries: a.tries,
    where: a.where === null ? null : { column: a.where, kind: a.whereKind ?? "crag" },
    notes: a.notes,
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
