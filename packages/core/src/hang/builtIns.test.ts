import { describe, expect, it } from "vitest";
import { entryNames, entryText, libraryIdOf, type BuiltInGripEntry } from "./builtIns";

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

describe("libraryIdOf", () => {
  it("camelCases an exercise and prefixes a workout by its kind", () => {
    expect(libraryIdOf("exercise", "Pull-ups", "strength")).toBe("pullUps");
    expect(libraryIdOf("exercise", "Offset pull-ups, each side", "strength")).toBe(
      "offsetPullUpsEachSide"
    );
    expect(libraryIdOf("workout", "Pull day", "strength")).toBe("strength-pull-day");
    expect(libraryIdOf("workout", "Max hangs", "hangboard")).toBe("fingers-max-hangs");
    expect(libraryIdOf("exercise", "Élan  vital", "other")).toBe("elanVital");
    expect(libraryIdOf("exercise", "  ·  ", "other")).toBe("");
  });
});
