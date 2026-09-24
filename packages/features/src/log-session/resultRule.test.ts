import { describe, expect, it } from "vitest";
import { firstGoStyleOf, resultOutcome } from "./resultRule";

describe("resultOutcome", () => {
  it("is an attempt when not sent, whatever the tries", () => {
    expect(resultOutcome("boulder", false, 1, "onsight")).toEqual({ kind: "attempt" });
    expect(resultOutcome("route", false, 4, "flash")).toEqual({ kind: "attempt" });
  });

  it("collapses to redpoint above one try", () => {
    expect(resultOutcome("boulder", true, 2, "flash")).toEqual({
      kind: "send",
      style: "redpoint",
    });
    expect(resultOutcome("route", true, 3, "onsight")).toEqual({
      kind: "send",
      style: "redpoint",
    });
  });

  it("flashes a boulder on one try regardless of the picked style", () => {
    expect(resultOutcome("boulder", true, 1, "onsight")).toEqual({ kind: "send", style: "flash" });
  });

  it("gives a one-try route the picked style", () => {
    expect(resultOutcome("route", true, 1, "onsight")).toEqual({ kind: "send", style: "onsight" });
    expect(resultOutcome("route", true, 1, "flash")).toEqual({ kind: "send", style: "flash" });
  });
});

describe("firstGoStyleOf", () => {
  it("keeps a flash and defaults everything else to onsight", () => {
    expect(firstGoStyleOf({ style: "flash" })).toBe("flash");
    expect(firstGoStyleOf({ style: "onsight" })).toBe("onsight");
    expect(firstGoStyleOf({ style: "redpoint" })).toBe("onsight");
  });
});
