import { describe, expect, it } from "vitest";
import { firstRunGate, fromFirstRun } from "./firstRunGate";

const at = (path: string): URL => new URL(path, "https://sendtally.com");

describe("firstRunGate", () => {
  it("sends an account due first run there, but lets its import page load", () => {
    expect(firstRunGate(at("/app/plan"), true)).toBe("/app/start");
    expect(firstRunGate(at("/app/start"), true)).toBeNull();
    expect(firstRunGate(at("/app/import"), true)).toBeNull();
  });

  it("sends anyone else on from first run, and nowhere else", () => {
    expect(firstRunGate(at("/app/start"), false)).toBe("/app");
    expect(firstRunGate(at("/app/start"), undefined)).toBe("/app");
    expect(firstRunGate(at("/app/plan"), false)).toBeNull();
  });

  it("lets a finished account reopen the wizard onto a path", () => {
    expect(firstRunGate(at("/app/start?path=plan&from=account"), false)).toBeNull();
  });

  it("knows an import page opened from first run by where it goes back to", () => {
    expect(fromFirstRun("?then=%2Fapp%2Fstart&from=8a")).toBe(true);
    expect(fromFirstRun("")).toBe(false);
  });
});
