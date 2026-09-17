import { hashKey, type QueryClient, type QueryKey } from "@tanstack/react-query";
import type { ApiWrite } from "@sendtally/api-client";

export type WriteEffect = {
  stale: QueryKey[];
  /** The row a delete removed: marked stale but never refetched while its screen is still up. */
  gone: QueryKey | null;
};

const LOG: QueryKey[] = [["sessions"], ["sessionsWithClimbs"], ["session"], ["climbs"], ["tags"]];

/** Which cached reads a write can change, by the resource it hit. `null` is a path this map does not know, which stales everything. */
export function writeEffect({ method, path }: ApiWrite): WriteEffect | null {
  const [, version, resource, id, child] = path.split("/");
  if (version !== "v1") return null;
  const deleted = method === "DELETE" && id !== undefined && child === undefined;
  switch (resource) {
    case "sessions":
      return deleted
        ? { stale: [...LOG, ["entries"], ["entry"]], gone: ["session", id] }
        : { stale: LOG, gone: null };
    case "entries":
      return {
        stale: [["entries"], ["entry"], ["session"], ["tags"]],
        gone: deleted ? ["entry", id] : null,
      };
    case "gyms":
      return {
        stale: [["gyms"], ["sessions"], ["sessionsWithClimbs"], ["session"]],
        gone: null,
      };
    case "projects":
      return { stale: [["climbs"]], gone: null };
    case "preferences":
    case "connections":
      return { stale: [["status"]], gone: null };
    case "entitlements":
      return { stale: [["entitlements"]], gone: null };
    case "account":
      return { stale: [], gone: null };
    default:
      return null;
  }
}

export async function invalidateAfterWrite(client: QueryClient, write: ApiWrite): Promise<void> {
  const effect = writeEffect(write);
  if (effect === null) return client.invalidateQueries();
  const { stale, gone } = effect;
  const goneHash = gone === null ? null : hashKey(gone);
  if (gone !== null) await client.invalidateQueries({ queryKey: gone, refetchType: "none" });
  await Promise.all(
    stale.map((queryKey) =>
      client.invalidateQueries({ queryKey, predicate: (query) => query.queryHash !== goneHash })
    )
  );
}
