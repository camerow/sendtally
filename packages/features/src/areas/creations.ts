import type { AreaSummary, CreationItem, CreationRef } from "@sendtally/api-client";

// Moderation is internal tooling: English only, no i18n.

type Entity = { id: string; name: string; version: number; description: string | null };

export function creationEntity(item: CreationItem): Entity {
  return item.entity_type === "area" ? item.area : item.climb;
}

export function creationId(item: CreationItem): string {
  return creationEntity(item).id;
}

export function creationRef(item: CreationItem): CreationRef {
  const { id, version } = creationEntity(item);
  return { entity_type: item.entity_type, id, version };
}

export type CreationType = "all" | "area" | "climb";
export type DuplicateFilter = "all" | "clean" | "flagged";
export type CreationSort = "oldest" | "newest" | "size" | "name";

export type CreationFilter = {
  query: string;
  type: CreationType;
  duplicates: DuplicateFilter;
  sort: CreationSort;
};

export const EVERY_CREATION: CreationFilter = {
  query: "",
  type: "all",
  duplicates: "all",
  sort: "oldest",
};

export const CREATION_SORTS: readonly { value: CreationSort; label: string }[] = [
  { value: "oldest", label: "Oldest first" },
  { value: "newest", label: "Newest first" },
  { value: "size", label: "Most pending first" },
  { value: "name", label: "Area A-Z" },
];

const haystack = (item: CreationItem): string =>
  [
    creationEntity(item).name,
    item.area?.name,
    item.submitter?.name,
    ...item.trail.map((step) => step.name),
  ]
    .join(" ")
    .toLowerCase();

export function filterCreations(items: CreationItem[], filter: CreationFilter): CreationItem[] {
  const query = filter.query.trim().toLowerCase();
  return items.filter(
    (item) =>
      (filter.type === "all" || item.entity_type === filter.type) &&
      (filter.duplicates === "all" ||
        (filter.duplicates === "clean") === (item.candidates.length === 0)) &&
      (query === "" || haystack(item).includes(query))
  );
}

export type CreationRow = { item: CreationItem; id: string; level: number };

export type CreationGroup = {
  key: string;
  area: AreaSummary | null;
  trail: CreationItem["trail"];
  rows: CreationRow[];
};

// The areas above an item, nearest last, the item's own area included for a climb.
const chainOf = (item: CreationItem): string[] => [
  ...item.trail.map((step) => step.id),
  ...(item.entity_type === "climb" ? [item.climb.area_id] : []),
];

/**
 * Creations grouped under the topmost pending area they hang from, or the live area a climb
 * was added to. Rows read as a tree: an area, its climbs, then each area inside it.
 */
export function groupCreations(items: CreationItem[], sort: CreationSort): CreationGroup[] {
  const pendingAreas = new Map(
    items.flatMap((item) => (item.entity_type === "area" ? [[item.area.id, item] as const] : []))
  );
  const names = new Map(
    items.flatMap((item) => [
      ...item.trail.map((step) => [step.id, step.name] as const),
      ...(item.area === null ? [] : [[item.area.id, item.area.name] as const]),
    ])
  );
  const groups = new Map<string, CreationGroup & { order: Map<string, string> }>();

  for (const item of items) {
    const chain = [...chainOf(item), ...(item.entity_type === "area" ? [item.area.id] : [])];
    const top = chain.findIndex((id) => pendingAreas.has(id));
    const rootAt = top === -1 ? chain.length - 1 : top;
    const key = chain[rootAt] ?? creationId(item);
    const root = pendingAreas.get(key);
    const group = groups.get(key) ?? {
      key,
      area: root?.area ?? item.area,
      trail: root?.trail ?? item.trail,
      rows: [],
      order: new Map<string, string>(),
    };
    const inside = chain.slice(rootAt + 1);
    const level = top === -1 ? 0 : inside.length + (item.entity_type === "climb" ? 1 : 0);
    const path = inside.map((id) => `1:${names.get(id) ?? ""}:${id}`);
    if (item.entity_type === "climb") path.push(`0:${item.climb.name}:${item.climb.id}`);
    group.order.set(creationId(item), path.join("/"));
    group.rows.push({ item, id: creationId(item), level });
    groups.set(key, group);
  }

  const sorted = [...groups.values()].map(({ order, ...group }) => ({
    ...group,
    rows: group.rows.sort((a, b) => (order.get(a.id) ?? "").localeCompare(order.get(b.id) ?? "")),
  }));
  const times = (group: CreationGroup): string[] => group.rows.map((row) => row.item.created_at);
  const oldest = (group: CreationGroup): string => times(group).sort()[0] ?? "";
  const newest = (group: CreationGroup): string => times(group).sort().at(-1) ?? "";
  const compare: Record<CreationSort, (a: CreationGroup, b: CreationGroup) => number> = {
    oldest: (a, b) => oldest(a).localeCompare(oldest(b)),
    newest: (a, b) => newest(b).localeCompare(newest(a)),
    size: (a, b) => b.rows.length - a.rows.length,
    name: (a, b) => (a.area?.name ?? "").localeCompare(b.area?.name ?? ""),
  };
  return sorted.sort(compare[sort]);
}

/** Parents are approved before what they hold and rejected after it, however the requests are cut. */
export function decisionOrder(items: CreationItem[], action: "approve" | "reject"): CreationRef[] {
  const depth = (item: CreationItem): number =>
    item.entity_type === "area" ? item.area.depth : Infinity;
  const ordered = [...items].sort((a, b) => depth(a) - depth(b));
  return (action === "approve" ? ordered : ordered.reverse()).map(creationRef);
}

export function submitterRecord(submitter: NonNullable<CreationItem["submitter"]>): string {
  return submitter.approved + submitter.rejected === 0
    ? "First submission"
    : `${submitter.approved} approved · ${submitter.rejected} rejected`;
}

/** The ids between two rows, both included, for a shift-click. */
export function idsBetween(ids: string[], from: string, to: string): string[] {
  const [a, b] = [ids.indexOf(from), ids.indexOf(to)];
  if (a === -1 || b === -1) return [to];
  return ids.slice(Math.min(a, b), Math.max(a, b) + 1);
}

export const REJECT_REASONS: readonly string[] = [
  "Already exists",
  "Not enough detail to find it",
  "Wrong area",
  "Not the name it is known by",
];
