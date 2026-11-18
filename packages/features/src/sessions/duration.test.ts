import { describe, expect, it } from "vitest";
import { minutesOf } from "./duration";

describe("minutesOf", () => {
  it("keeps a length typed in seconds as whole minutes, one to a day", () => {
    expect(minutesOf(45 * 60)).toBe(45);
    expect(minutesOf(90)).toBe(2);
    expect(minutesOf(0)).toBe(1);
    expect(minutesOf(86399)).toBe(1440);
  });
});
