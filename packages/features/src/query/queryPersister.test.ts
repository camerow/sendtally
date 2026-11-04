import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { persistQueries, type QueryFiles } from "./queryPersister";

const memoryFiles = (): QueryFiles & { saved: Map<string, string> } => {
  const saved = new Map<string, string>();
  return {
    saved,
    read: async (key) => saved.get(key) ?? null,
    write: (key, value) => void saved.set(key, value),
    remove: (key) => void saved.delete(key),
  };
};

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const client = (files: QueryFiles): QueryClient => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  persistQueries(c, files, "v1");
  return c;
};

describe("persistQueries", () => {
  it("saves each read in its own file and restores it on the next launch without the network", async () => {
    const files = memoryFiles();
    await client(files).fetchQuery({ queryKey: ["sessions"], queryFn: () => ["a", "b"] });
    await client(files).fetchQuery({ queryKey: ["gyms"], queryFn: () => ["g"] });
    await settle();
    expect(files.saved.size).toBe(2);

    const network = vi.fn(() => ["fresh"]);
    const relaunched = client(files);
    const restored = await relaunched.fetchQuery({
      queryKey: ["sessions"],
      queryFn: network,
      staleTime: Infinity,
    });
    expect(restored).toEqual(["a", "b"]);
    expect(network).not.toHaveBeenCalled();
  });

  it("saves a write made on the phone, so it survives the app closing before it is sent", async () => {
    const files = memoryFiles();
    client(files).setQueryData(["climbs"], [{ id: "c1", working: true }]);
    await settle();
    const relaunched = client(files);
    const restored = await relaunched.fetchQuery({
      queryKey: ["climbs"],
      queryFn: () => [],
      staleTime: Infinity,
    });
    expect(restored).toEqual([{ id: "c1", working: true }]);
  });

  it("drops a read's file with the read, and never saves Areas lookups", async () => {
    const files = memoryFiles();
    const c = client(files);
    c.setQueryData(["sessions"], []);
    c.setQueryData(["area", "fontainebleau"], {});
    await settle();
    expect([...files.saved.keys()]).toEqual(['tanstack-query-["sessions"]']);
    c.clear();
    expect(files.saved.size).toBe(0);
  });

  it("does not restore a copy saved by another app version", async () => {
    const files = memoryFiles();
    client(files).setQueryData(["sessions"], ["old"]);
    await settle();
    const upgraded = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    persistQueries(upgraded, files, "v2");
    const read = await upgraded.fetchQuery({ queryKey: ["sessions"], queryFn: () => ["new"] });
    expect(read).toEqual(["new"]);
  });
});
