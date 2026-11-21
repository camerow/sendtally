import { MATCH_SAMPLE_ROWS, toCsv, type ColumnMatch } from "@sendtally/core/import";
import { z } from "zod";

export const MATCH_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const MATCHES_PER_DAY = 20;

const MAX_COLUMNS = 80;

export const matchBody = z.object({
  header: z.array(z.string().max(200)).min(1).max(MAX_COLUMNS),
  rows: z.array(z.array(z.string().max(500)).max(MAX_COLUMNS)).max(MATCH_SAMPLE_ROWS),
});

export type MatchBody = z.infer<typeof matchBody>;

const column = z.string().nullable();
const scale = z.enum(["v", "font", "yds", "french"]).nullable();
const gradeColumn = z.object({ column: z.string(), scale });

const answer = z.object({
  date: column,
  climb: column,
  grade: gradeColumn.nullable(),
  otherGrade: gradeColumn.nullable(),
  result: z
    .object({
      column: z.string(),
      values: z.array(
        z.object({
          value: z.string(),
          means: z.enum(["send", "attempt", "flash", "onsight", "redpoint"]),
        })
      ),
    })
    .nullable(),
  tries: column,
  where: z.object({ column: z.string(), kind: z.enum(["gym", "crag"]) }).nullable(),
  notes: column,
});

const { $schema: _, ...answerSchema } = z.toJSONSchema(answer);

export const matchPrompt = (body: MatchBody): { role: "system" | "user"; content: string }[] => [
  {
    role: "system",
    content: `You match the columns of a climbing log spreadsheet to a climbing app's fields. You get the header and the first rows as CSV. Answer with each field's column, using the header name exactly as written, or null when no column holds it. Never invent a column.
- date: the day of the climb. grade: the grade of the climb. If the sheet is not a log of climbs with a date and a grade, answer null for both.
- grade and otherGrade: when boulder and route grades are in separate columns, grade is one and otherGrade the other; else otherGrade is null. scale is the grade system the column is written in: "v" (V4, or bare numbers in a V column), "font" (6A+), "yds" (5.11b, or 11b without the 5.), "french" (7a), or null if unsure.
- climb: the climb's name. tries: the number of attempts. notes: free text about the climb. where: the gym or crag, with kind "gym" for an indoor gym and "crag" for outdoor climbing.
- result: the column saying whether the climb was sent, with every distinct value seen in the rows mapped to send, attempt (not topped: fell, project, no, n), flash, onsight or redpoint.`,
  },
  { role: "user", content: toCsv([body.header, ...body.rows]) },
];

export const responseFormat = { type: "json_schema" as const, json_schema: answerSchema };

// The model's answer as a match on this header, or null: it found no date or grade, named
// a column the sheet does not have, or did not answer in the schema.
export function matchOf(output: unknown, header: string[]): ColumnMatch | "no_match" | null {
  const raw = typeof output === "string" ? safeJson(output) : output;
  const parsed = answer.safeParse(raw);
  if (!parsed.success) return null;
  const a = parsed.data;
  if (a.date === null || a.grade === null) return "no_match";
  const named = [
    a.date,
    a.climb,
    a.grade.column,
    a.otherGrade?.column,
    a.result?.column,
    a.tries,
    a.where?.column,
    a.notes,
  ];
  if (!named.every((c) => c == null || header.includes(c))) return null;
  return { ...a, date: a.date, grade: a.grade };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
