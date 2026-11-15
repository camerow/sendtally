import { describe, expect, it } from "vitest";
import { firstRunGate } from "./firstRunGate";

describe("firstRunGate", () => {
  it("sends an account due first run there, but lets its import page load", () => {
    expect(firstRunGate("/app/plan", true)).toBe("/app/start");
    expect(firstRunGate("/app/start", true)).toBeNull();
    expect(firstRunGate("/app/import", true)).toBeNull();
  });

  it("sends anyone else on from first run, and nowhere else", () => {
    expect(firstRunGate("/app/start", false)).toBe("/app");
    expect(firstRunGate("/app/start", undefined)).toBe("/app");
    expect(firstRunGate("/app/plan", false)).toBeNull();
  });
});
