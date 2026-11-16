import { describe, expect, it } from "vitest";
import { entryNames, entryText, type BuiltInGripEntry } from "./builtIns";

const half: BuiltInGripEntry = {
  type: "grip",
  id: "half",
  status: "active",
  name: "Half crimp",
  description: "Index to ring at ninety degrees.",
  translations: { de: { name: "Halbe Leiste" }, fr: { name: "", description: "" } },
  media: [],
  updatedAt: null,
};

describe("library entries", () => {
  it("read in a language, each field falling back to English", () => {
    expect(entryText(half, "de")).toEqual({
      name: "Halbe Leiste",
      description: "Index to ring at ninety degrees.",
    });
    expect(entryText(half, "fr").name).toBe("Half crimp");
    expect(entryText(half, "en").name).toBe("Half crimp");
  });

  it("go by every name they have", () => {
    expect(entryNames(half)).toEqual(["Half crimp", "Halbe Leiste"]);
  });
});
