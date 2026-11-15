import { describe, expect, it } from "vitest";
import type { LibraryChange } from "@sendtally/api-client";
import {
  changeSummary,
  descriptionSummary,
  entryKicker,
  filterCounts,
  libraryGroups,
  libraryTabCount,
} from "./moderation";
import { TEST_LIBRARY } from "./testLibrary";

const library = {
  ...TEST_LIBRARY,
  grips: TEST_LIBRARY.grips.map((g) =>
    g.id === "mono"
      ? { ...g, status: "retired" as const }
      : { ...g, description: g.id === "half" ? "Index to ring." : "" }
  ),
};

const state = (more: Partial<LibraryChange["before"]> = {}): LibraryChange["before"] => ({
  name: "Half crimp",
  description: "",
  translations: { de: { name: "Halbe Leiste" } },
  status: "active",
  ...more,
});

describe("moderation library", () => {
  it("groups workouts first, then fingers and each exercise category, by filter", () => {
    expect(libraryGroups(library, "all").map((g) => g.title)).toEqual([
      "Workouts",
      "Fingers exercises",
      "Climbing exercises",
      "Strength exercises",
      "Mobility exercises",
      "Other exercises",
    ]);
    expect(libraryGroups(library, "retired")).toEqual([
      { title: "Fingers exercises", entries: [library.grips.find((g) => g.id === "mono")] },
    ]);
    const fingers = libraryGroups(library, "noDescription").find(
      (g) => g.title === "Fingers exercises"
    );
    expect(fingers?.entries.map((e) => e.id)).not.toContain("half");
    expect(fingers?.entries.map((e) => e.id)).not.toContain("mono");
  });

  it("counts what each filter shows, and the tab counts what is missing a description", () => {
    const counts = filterCounts(library);
    expect(counts.retired).toBe(1);
    expect(counts.all).toBe(TEST_LIBRARY.exercises.length + TEST_LIBRARY.workouts.length + 11);
    expect(libraryTabCount(library)).toBe(counts.noDescription);
  });

  it("says what a description holds", () => {
    expect(descriptionSummary(" ")).toBeNull();
    expect(descriptionSummary("One.")).toBe("1 paragraph");
    expect(descriptionSummary("One.\n\nTwo.")).toBe("2 paragraphs");
    expect(descriptionSummary("Lead.\n- a\n- b")).toBe("list");
  });

  it("names a change in a few words", () => {
    expect(changeSummary({ before: state(), after: state({ status: "retired" }) })).toBe("Retired");
    expect(changeSummary({ before: state({ status: "retired" }), after: state() })).toBe(
      "Unretired"
    );
    expect(changeSummary({ before: state(), after: state({ description: "New" }) })).toBe(
      "Description edited"
    );
    expect(
      changeSummary({ before: state(), after: state({ name: "Half", translations: {} }) })
    ).toBe("Name and other names edited");
  });

  it("titles an item by its category and type", () => {
    expect(entryKicker(library.grips[0]!)).toBe("Fingers exercise · built-in");
    expect(entryKicker(library.workouts[0]!)).toBe("Fingers workout · built-in");
  });
});
