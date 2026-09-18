import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@sendtally/api-client";
import { saveWithDuplicateCheck } from "./duplicateCheck";

describe("saveWithDuplicateCheck", () => {
  it("stops on look-alikes before creating anything", async () => {
    const create = vi.fn(() => Promise.resolve("created"));
    const outcome = await saveWithDuplicateCheck(false, {
      similar: () => Promise.resolve(["Buttermilk"]),
      create,
    });
    expect(outcome).toEqual({ kind: "candidates", candidates: ["Buttermilk"] });
    expect(create).not.toHaveBeenCalled();
  });

  it("creates unconfirmed when nothing looks alike, and confirmed once candidates were shown", async () => {
    const create = vi.fn((confirmed: boolean) => Promise.resolve(confirmed));
    const similar = vi.fn(() => Promise.resolve([]));
    expect(await saveWithDuplicateCheck(false, { similar, create })).toEqual({
      kind: "saved",
      result: false,
    });
    expect(await saveWithDuplicateCheck(true, { similar, create })).toEqual({
      kind: "saved",
      result: true,
    });
    expect(similar).toHaveBeenCalledTimes(1);
  });

  it("turns the server's 409 into candidates and rethrows anything else", async () => {
    const conflict = new ApiError(409, "possible duplicates", { candidates: ["Milks"] });
    expect(
      await saveWithDuplicateCheck(false, {
        similar: () => Promise.resolve([]),
        create: () => Promise.reject(conflict),
      })
    ).toEqual({ kind: "candidates", candidates: ["Milks"] });
    await expect(
      saveWithDuplicateCheck(true, {
        similar: () => Promise.resolve([]),
        create: () => Promise.reject(new ApiError(500, "boom")),
      })
    ).rejects.toThrow("boom");
  });
});
