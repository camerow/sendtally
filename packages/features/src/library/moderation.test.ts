import { describe, expect, it } from "vitest";
import type { LibraryChange } from "@sendtally/api-client";
import {
  changeRestore,
  changeSummary,
  descriptionSummary,
  entryKicker,
  filterCounts,
  libraryGroups,
  libraryGapCount,
  pictureSummary,
} from "./moderation";
import { TEST_LIBRARY } from "./testLibrary";

const picture = {
  kind: "picture" as const,
  url: "https://media.test/a-1600.jpg",
  thumbUrl: "https://media.test/a-144.jpg",
  width: 1600,
  height: 1200,
  alt: "Four fingers on an edge",
  credit: "",
};

const library = {
  ...TEST_LIBRARY,
  grips: TEST_LIBRARY.grips.map((g) =>
    g.id === "mono"
      ? { ...g, status: "retired" as const }
      : g.id === "half"
        ? { ...g, description: "Index to ring.", media: [picture, picture] }
        : { ...g, description: "" }
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

  it("counts what each filter shows", () => {
    const offered =
      TEST_LIBRARY.exercises.length + TEST_LIBRARY.workouts.length + library.grips.length - 1;
    expect(filterCounts(library)).toEqual({
      all: offered,
      noDescription: offered - TEST_LIBRARY.workouts.filter((w) => w.description !== "").length - 1,
      noPicture: offered - 1,
      retired: 1,
    });
    expect(libraryGapCount(library)).toBe(offered - 1);
    const half = library.grips.find((g) => g.id === "half")!;
    expect(pictureSummary(half)).toBe("2 pictures");
    expect(pictureSummary(library.grips[1]!)).toBe("No picture");
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

  it("names a change to the pictures, and offers Restore unless a file came or went", () => {
    const a = { id: "a", alt: "", credit: "" };
    const b = { id: "b", alt: "Edge", credit: "" };
    const pictures = (before: (typeof a)[], after: (typeof a)[]) => ({
      before: state({ media: before }),
      after: state({ media: after }),
    });
    expect(changeSummary(pictures([a], [a, b]))).toBe("Picture added");
    expect(changeRestore(pictures([a], [a, b]))).toBeNull();
    expect(changeSummary(pictures([a, b], [a]))).toBe("Picture deleted");
    expect(changeRestore(pictures([a, b], [a]))).toBe("permanent");
    expect(changeSummary(pictures([a, b], [b, a]))).toBe("Picture 2 moved up");
    expect(changeSummary(pictures([a], [{ ...a, alt: "Wall" }]))).toBe("Picture 1 alt text edited");
    expect(changeSummary(pictures([a], [{ ...a, credit: "Will" }]))).toBe(
      "Picture 1 credit edited"
    );
    expect(changeRestore(pictures([a, b], [b, a]))).toBe("restore");
    expect(changeRestore({ before: state(), after: state({ description: "New" }) })).toBe(
      "restore"
    );
  });

  it("titles an item by its category and type", () => {
    expect(entryKicker(library.grips[0]!)).toBe("Fingers exercise · built-in");
    expect(entryKicker(library.workouts[0]!)).toBe("Fingers workout · built-in");
  });
});
