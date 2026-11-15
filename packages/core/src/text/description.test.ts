import { describe, expect, it } from "vitest";
import {
  descriptionRuns,
  descriptionUnits,
  foldAt,
  linkText,
  parseDescription,
} from "./description";

const text = (t: string) => ({ kind: "text", text: t });
const link = (url: string) => ({ kind: "link", url });

describe("parseDescription", () => {
  it("is empty for blank text", () => {
    expect(parseDescription("")).toEqual([]);
    expect(parseDescription("  \n\n ")).toEqual([]);
  });

  it("splits paragraphs on a blank line and keeps the line breaks inside one", () => {
    expect(parseDescription("Warm up well.\nThen go.\n\n  \nRest after.")).toEqual([
      { kind: "paragraph", lines: [[text("Warm up well.")], [text("Then go.")]] },
      { kind: "paragraph", lines: [[text("Rest after.")]] },
    ]);
  });

  it("reads dash lines as bullets and numbered lines as steps", () => {
    expect(
      parseDescription("Cues:\n- Shoulders down\n- Hips in\n1. Hang\n2. Rest\r\nDone")
    ).toEqual([
      { kind: "paragraph", lines: [[text("Cues:")]] },
      { kind: "bullets", items: [[text("Shoulders down")], [text("Hips in")]] },
      { kind: "numbered", items: [[text("Hang")], [text("Rest")]] },
      { kind: "paragraph", lines: [[text("Done")]] },
    ]);
  });

  it("interprets nothing else", () => {
    expect(parseDescription("# Title\n* star\n-nospace\n1.5 kg\n<b>bold</b>")).toEqual([
      {
        kind: "paragraph",
        lines: [
          [text("# Title")],
          [text("* star")],
          [text("-nospace")],
          [text("1.5 kg")],
          [text("<b>bold</b>")],
        ],
      },
    ]);
  });
});

describe("descriptionRuns", () => {
  it("links bare https URLs, leaving trailing punctuation as text", () => {
    expect(descriptionRuns("See https://sendtally.com/a?b=1. Then (https://x.io) go")).toEqual([
      text("See "),
      link("https://sendtally.com/a?b=1"),
      text(". Then ("),
      link("https://x.io"),
      text(") go"),
    ]);
  });

  it("reads no named links: the brackets stay text and only the address links", () => {
    expect(descriptionRuns("Watch [the demo](https://youtu.be/abc) first")).toEqual([
      text("Watch [the demo]("),
      link("https://youtu.be/abc"),
      text(") first"),
    ]);
  });

  it("leaves anything but https as text", () => {
    expect(descriptionRuns("[x](http://a.b) javascript:alert(1) http://a.b")).toEqual([
      text("[x](http://a.b) javascript:alert(1) http://a.b"),
    ]);
  });
});

describe("linkText", () => {
  it("shows an address without its scheme and www., cut at 24 characters", () => {
    expect(linkText("https://www.x.io/a")).toBe("x.io/a");
    expect(linkText("https://sendtally.com/training/hangboard/repeaters")).toBe(
      "sendtally.com/training/…"
    );
  });
});

describe("descriptionUnits", () => {
  it("lays out paragraphs and list items in order, steps numbered from one per list", () => {
    const units = descriptionUnits(parseDescription("Go.\n- a\n- b\n1. c\n2. d"));
    expect(units.map((u) => (u.kind === "step" ? `${u.kind}${u.n}` : u.kind))).toEqual([
      "paragraph",
      "bullet",
      "bullet",
      "step1",
      "step2",
    ]);
  });
});

describe("foldAt", () => {
  it("does not fold what fits in five lines", () => {
    expect(foldAt([2, 1, 2])).toBeNull();
    expect(foldAt([])).toBeNull();
  });

  it("cuts the unit that crosses the fold to the lines left", () => {
    expect(foldAt([2, 4, 1])).toEqual({ units: 2, lastLines: 3 });
    expect(foldAt([9])).toEqual({ units: 1, lastLines: 5 });
  });

  it("ends on a whole unit when the fold falls between two", () => {
    expect(foldAt([3, 2, 1])).toEqual({ units: 2, lastLines: null });
  });
});
