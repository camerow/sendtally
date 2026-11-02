import { describe, expect, it } from "@jest/globals";
import { restAfter, restLeft, withMoreRest } from "./restCountdown";

const T0 = 1_000_000;

describe("rest countdown", () => {
  it("counts down whole seconds to zero, and stays there", () => {
    const rest = restAfter("0:0", 90, null, T0);
    expect(rest === null ? null : restLeft(rest, T0)).toBe(90);
    expect(rest === null ? null : restLeft(rest, T0 + 30_500)).toBe(60);
    expect(rest === null ? null : restLeft(rest, T0 + 90_000)).toBe(0);
    expect(rest === null ? null : restLeft(rest, T0 + 200_000)).toBe(0);
  });

  it("starts no rest where there is none to take", () => {
    expect(restAfter("0:0", 0, null, T0)).toBeNull();
  });

  it("takes thirty seconds more on the clock and the bar", () => {
    const rest = restAfter("after:0", 60, "Row", T0);
    const more = rest === null ? null : withMoreRest(rest);
    expect(more).toMatchObject({ at: "after:0", next: "Row", seconds: 90 });
    expect(more === null ? null : restLeft(more, T0 + 10_000)).toBe(80);
  });

  it("ends early when the next tick starts its own", () => {
    const first = restAfter("0:0", 90, null, T0);
    const second = restAfter("0:1", 90, null, T0 + 20_000);
    expect(first?.at).toBe("0:0");
    expect(second).toMatchObject({ at: "0:1", endsAt: T0 + 110_000 });
  });
});
