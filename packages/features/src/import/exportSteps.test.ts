import { describe, expect, it } from "vitest";
import { exportPageUrl } from "@sendtally/core/import";
import { exportLinkLabel, exportSteps, importSourceOf, stepsText } from "./exportSteps";

describe("exportSteps", () => {
  it("names each service's menus as the service writes them, and ends on choosing the file", () => {
    expect(exportSteps("mountainProject")).toEqual([
      "Sign in at mountainproject.com.",
      "Open your profile, then Ticks.",
      "Select Export CSV to download the file.",
      "Choose the file here.",
    ]);
    expect(exportSteps("theCrag")[1]).toBe("From the Action menu, select Select logbook as CSV.");
    expect(exportSteps("8a")[2]).toBe(
      "At the bottom, under Logbook Export (CSV), download the file."
    );
  });

  it("gives Kaya no steps, only its search", () => {
    expect(exportSteps("kaya")).toEqual([]);
    expect(exportLinkLabel("kaya", exportPageUrl("kaya"), "Kaya")).toBe(
      "Search for the Kaya export"
    );
  });

  it("labels a link by the site it opens", () => {
    expect(exportLinkLabel("8a", exportPageUrl("8a"), "8a.nu")).toBe("Open 8a.nu");
    expect(exportLinkLabel("theCrag", exportPageUrl("theCrag"), "theCrag")).toBe(
      "Open thecrag.com"
    );
  });

  it("never tells anyone to tap, so the steps read right on a computer", () => {
    const all = (["8a", "mountainProject", "sendage", "theCrag"] as const).flatMap(exportSteps);
    expect(all.filter((s) => /\btap\b/i.test(s))).toEqual([]);
  });

  it("numbers the steps as a description's lines", () => {
    expect(stepsText(["One.", "Two."])).toBe("1. One.\n2. Two.");
  });

  it("reads only a known source from the page's address", () => {
    expect(importSourceOf("mountainProject")).toBe("mountainProject");
    expect(importSourceOf("spreadsheet")).toBe("spreadsheet");
    expect(importSourceOf("none")).toBeUndefined();
    expect(importSourceOf("toString")).toBeUndefined();
    expect(importSourceOf(null)).toBeUndefined();
  });
});
