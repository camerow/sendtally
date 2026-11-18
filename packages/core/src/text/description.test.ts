import { describe, expect, it } from "vitest";
import { descriptionRuns, descriptionUnits, foldAt, linkText } from "./description";

const text = (t: string) => ({ kind: "text", text: t });
const link = (url: string) => ({ kind: "link", url });

describe("descriptionUnits", () => {
  it("is empty for blank text", () => {
    expect(descriptionUnits("")).toEqual([]);
    expect(descriptionUnits("  \n\n ")).toEqual([]);
  });

  it("splits paragraphs on a blank line and keeps the line breaks inside one", () => {
    expect(descriptionUnits("Warm up well.\nThen go.\n\n  \nRest after.")).toEqual([
      { kind: "paragraph", lines: [[text("Warm up well.")], [text("Then go.")]] },
      { kind: "paragraph", lines: [[text("Rest after.")]] },
    ]);
  });

  it("reads dash lines as bullets and numbered lines as steps, each run of steps from one", () => {
    expect(
      descriptionUnits("Cues:\n- Shoulders down\n- Hips in\n1. Hang\n2. Rest\r\nDone\n4. Again")
    ).toEqual([
      { kind: "paragraph", lines: [[text("Cues:")]] },
      { kind: "bullet", line: [text("Shoulders down")] },
      { kind: "bullet", line: [text("Hips in")] },
      { kind: "step", n: 1, line: [text("Hang")] },
      { kind: "step", n: 2, line: [text("Rest")] },
      { kind: "paragraph", lines: [[text("Done")]] },
      { kind: "step", n: 1, line: [text("Again")] },
    ]);
  });

  it("starts a new paragraph after a list", () => {
    expect(descriptionUnits("- a\nAfter\nmore")).toEqual([
      { kind: "bullet", line: [text("a")] },
      { kind: "paragraph", lines: [[text("After")], [text("more")]] },
    ]);
  });

  it("interprets nothing else", () => {
    expect(descriptionUnits("# Title\n* star\n-nospace\n1.5 kg\n<b>bold</b>")).toEqual([
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

  it("keeps parentheses that come in pairs inside an address", () => {
    expect(descriptionRuns("See https://en.wikipedia.org/wiki/Crimp_(climbing).")).toEqual([
      text("See "),
      link("https://en.wikipedia.org/wiki/Crimp_(climbing)"),
      text("."),
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

describe("foldAt", () => {
  it("does not fold what fits in five lines", () => {
    expect(foldAt([2, 1, 2])).toBeNull();
    expect(foldAt([])).toBeNull();
  });

  it("cuts the unit that crosses the fold to the lines left", () => {
    expect(foldAt([2, 4, 1])).toEqual({ units: 2, lastLines: 3 });
    expect(foldAt([9])).toEqual({ units: 1, lastLines: 5 });
  });

  it("folds at fewer lines when asked, as a running workout's description does", () => {
    expect(foldAt([2, 1, 2], 3)).toEqual({ units: 2, lastLines: null });
    expect(foldAt([1, 1], 3)).toBeNull();
  });

  it("ends on a whole unit when the fold falls between two", () => {
    expect(foldAt([3, 2, 1])).toEqual({ units: 2, lastLines: null });
  });
});
