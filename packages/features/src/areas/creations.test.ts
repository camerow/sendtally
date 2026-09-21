import { describe, expect, it } from "vitest";
import type { CreationItem } from "@sendtally/api-client";
import {
  decisionOrder,
  EVERY_CREATION,
  filterCreations,
  groupCreations,
  idsBetween,
  submitterRecord,
} from "./creations";

type Step = { id: string; name: string; slug: string };
const step = (id: string, name: string): Step => ({ id, name, slug: id });
const california = step("ca", "California");

const area = (
  id: string,
  name: string,
  trail: Step[],
  extra: { created_at?: string; candidates?: unknown[]; status?: string } = {}
): CreationItem =>
  ({
    entity_type: "area",
    created_at: extra.created_at ?? "2026-09-01",
    area: { id, name, depth: trail.length, version: 1, status: extra.status ?? "pending" },
    trail,
    submitter: { id: "u1", name: "mara", approved: 2, rejected: 0 },
    candidates: extra.candidates ?? [],
  }) as unknown as CreationItem;

const climb = (
  id: string,
  name: string,
  inArea: CreationItem,
  extra: { created_at?: string; candidates?: unknown[] } = {}
): CreationItem =>
  ({
    entity_type: "climb",
    created_at: extra.created_at ?? "2026-09-02",
    climb: { id, name, area_id: inArea.area?.id, version: 1 },
    area: inArea.area,
    trail: inArea.trail,
    submitter: null,
    candidates: extra.candidates ?? [],
  }) as unknown as CreationItem;

const hollow = area("hollow", "Granite Hollow", [california]);
const creekside = area("creek", "Creekside", [california, step("hollow", "Granite Hollow")]);
const splitRock = area("split", "Split Rock", [
  california,
  step("hollow", "Granite Hollow"),
  step("creek", "Creekside"),
]);
const liveWall = area("wall", "Mill Creek Wall", [california], { status: "active" });

describe("groupCreations", () => {
  it("reads a pending chain as one tree: an area, its climbs, then the areas inside it", () => {
    const items = [
      climb("c3", "Fault Line", splitRock),
      splitRock,
      climb("c1", "Slow Burn", hollow),
      creekside,
      hollow,
    ];
    const [group, ...rest] = groupCreations(items, "oldest");
    expect(rest).toEqual([]);
    expect(group?.area?.name).toBe("Granite Hollow");
    expect(group?.trail).toEqual([california]);
    expect(group?.rows.map((row) => [row.id, row.level])).toEqual([
      ["hollow", 0],
      ["c1", 1],
      ["creek", 1],
      ["split", 2],
      ["c3", 3],
    ]);
  });

  it("keeps climbs added to a live area flat under it, and sorts the groups", () => {
    const items = [
      hollow,
      climb("c5", "Ferryman", liveWall, { created_at: "2026-08-01" }),
      climb("c6", "Undertow", liveWall, { created_at: "2026-09-09" }),
    ];
    const keys = (sort: Parameters<typeof groupCreations>[1]): string[] =>
      groupCreations(items, sort).map((group) => group.key);
    expect(groupCreations(items, "oldest")[0]?.rows.map((row) => row.level)).toEqual([0, 0]);
    expect(keys("oldest")).toEqual(["wall", "hollow"]);
    expect(keys("newest")).toEqual(["wall", "hollow"]);
    expect(keys("size")).toEqual(["wall", "hollow"]);
    expect(keys("name")).toEqual(["hollow", "wall"]);
  });
});

describe("filterCreations", () => {
  const flagged = climb("c2", "Slow Burn Left", hollow, { candidates: [{ id: "c1" }] });
  const items = [hollow, climb("c1", "Slow Burn", hollow), flagged];

  it("searches names, the trail and the submitter, and narrows by type and duplicates", () => {
    const ids = (filter: Partial<typeof EVERY_CREATION>): number =>
      filterCreations(items, { ...EVERY_CREATION, ...filter }).length;
    expect(ids({})).toBe(3);
    expect(ids({ query: "california" })).toBe(3);
    expect(ids({ query: " MARA " })).toBe(1);
    expect(ids({ query: "left" })).toBe(1);
    expect(ids({ type: "area" })).toBe(1);
    expect(ids({ duplicates: "clean" })).toBe(2);
    expect(filterCreations(items, { ...EVERY_CREATION, duplicates: "flagged" })).toEqual([flagged]);
  });
});

describe("decisionOrder", () => {
  it("approves down the tree and rejects up it", () => {
    const items = [climb("c1", "Slow Burn", hollow), splitRock, hollow, creekside];
    expect(decisionOrder(items, "approve").map((ref) => ref.id)).toEqual([
      "hollow",
      "creek",
      "split",
      "c1",
    ]);
    expect(decisionOrder(items, "reject").map((ref) => ref.id)).toEqual([
      "c1",
      "split",
      "creek",
      "hollow",
    ]);
  });
});

describe("submitterRecord and idsBetween", () => {
  it("describes a record and spans a shift-click either way round", () => {
    expect(submitterRecord({ id: "u", name: null, approved: 0, rejected: 0 })).toBe(
      "First submission"
    );
    expect(submitterRecord({ id: "u", name: null, approved: 3, rejected: 1 })).toBe(
      "3 approved · 1 rejected"
    );
    expect(idsBetween(["a", "b", "c", "d"], "c", "a")).toEqual(["a", "b", "c"]);
    expect(idsBetween(["a", "b"], "gone", "b")).toEqual(["b"]);
  });
});
