import { describe, expect, it } from "vitest";
import type { ClimbSummary, SessionClimb, SessionDetail } from "@sendtally/api-client";
import { sessionClimbRows } from "./rows";

const popular = { id: "a1", name: "Stanage Popular", slug: "stanage-popular" };
const plantation = { id: "a2", name: "Stanage Plantation", slug: "stanage-plantation" };

let minute = 0;
const climb = (over: Partial<SessionClimb> = {}): SessionClimb => ({
  time: `2026-10-31T10:${String(minute++).padStart(2, "0")}:00.000Z`,
  name: "",
  vGrade: 4,
  grade: { scale: "v", value: 4 },
  kind: "send",
  tries: 1,
  angle: null,
  note: null,
  area: null,
  link: null,
  ...over,
});

const session = (
  climbs: SessionClimb[],
  over: Partial<SessionDetail> = {}
): Pick<SessionDetail, "climbs" | "areas" | "location"> => ({
  location: "outdoor",
  areas: [],
  climbs,
  ...over,
});

const record = (id: string, name: string, over: Partial<ClimbSummary> = {}): ClimbSummary =>
  ({ id, name, project: false, sent_at: null, area: null, ...over }) as ClimbSummary;

describe("sessionClimbRows", () => {
  it("is one row per named climb, tries summed, opening its climb", () => {
    const rows = sessionClimbRows(
      session([
        climb({ name: "The Prow", kind: "attempt", tries: 3 }),
        climb({ name: "the prow", kind: "attempt", tries: 1 }),
      ]),
      [record("p", "The Prow", { project: true })]
    );
    expect(rows).toEqual([
      expect.objectContaining({
        id: "p",
        name: "The Prow",
        meta: "4 tries",
        pill: { kind: "project", label: "Project" },
      }),
    ]);
  });

  it("merges unnamed climbs of one grade into its discipline, muted and never opened", () => {
    const rows = sessionClimbRows(
      session([
        climb({ tries: 2, kind: "attempt" }),
        climb({ tries: 3 }),
        climb({ grade: { scale: "french", value: "6b+" }, vGrade: 4, style: "flash" }),
      ]),
      []
    );
    expect(rows.map((r) => [r.id, r.name, r.count, r.meta, r.pill?.label])).toEqual([
      [null, "Boulder", 2, "5 tries", "Sent"],
      [null, "Route", 1, "1 try", "Flash"],
    ]);
  });

  it("fills the badge with an unnamed circuit climb's colour, merging by circuit", () => {
    const blue = { id: "b", label: "Blue", colour: "blue" as const };
    const rows = sessionClimbRows(
      session([climb({ circuit: blue, tries: 2 }), climb({ circuit: blue, vGrade: 3 })], {
        location: "indoor",
      }),
      []
    );
    expect(rows).toEqual([
      expect.objectContaining({
        id: null,
        name: "Boulder",
        count: 2,
        colour: "blue",
        meta: "3 tries",
      }),
    ]);
  });

  it("keeps an endurance climb's laps under its row, without a result pill", () => {
    const endurance = { unit: "moves" as const, target: 40, laps: [40, 40, 28] };
    const [row] = sessionClimbRows(session([climb({ name: "Green circuit laps", endurance })]), [
      record("g", "Green circuit laps"),
    ]);
    expect(row).toMatchObject({ id: "g", endurance, pill: null });
    expect(row?.meta).toMatch(/^3 laps · /);
  });

  it("names each climb's area only on a two-area day or in an Indoor session", () => {
    const climbs = [
      climb({ name: "Flying Buttress", area: popular }),
      climb({ name: "Crack and Slab", area: plantation }),
    ];
    const records = [record("f", "Flying Buttress"), record("c", "Crack and Slab")];
    const two = sessionClimbRows(session(climbs, { areas: [popular, plantation] }), records);
    expect(two.map((r) => r.meta)).toEqual([
      "Stanage Popular · 1 try",
      "Stanage Plantation · 1 try",
    ]);

    const one = sessionClimbRows(session([climbs[0]!], { areas: [popular] }), records);
    expect(one[0]?.meta).toBe("1 try");

    const gym = sessionClimbRows(
      session([climbs[0]!, climb({ tries: 2 })], { location: "indoor", areas: [popular] }),
      records
    );
    expect(gym.map((r) => r.meta)).toEqual(["Stanage Popular · 1 try", "2 tries"]);
  });
});
