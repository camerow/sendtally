import { describe, expect, it } from "vitest";
import { hangCount, hangLoadText } from "./hangText";

describe("hangText", () => {
  it("reads a load as added, assisted or bodyweight", () => {
    expect(hangLoadText(10, "kg")).toBe("+10 kg");
    expect(hangLoadText(-5, "kg")).toBe("−5 kg");
    expect(hangLoadText(0, "kg")).toBe("BW");
  });

  it("counts hangs held, with the top load unless all were bodyweight", () => {
    const grid = { rows: [], held: 5, total: 6 };
    expect(hangCount({ ...grid, loads: [0, 0] }, "kg")).toBe("5 of 6 hangs");
    expect(hangCount({ ...grid, loads: [0, 10] }, "kg")).toBe("5 of 6 hangs · top load +10 kg");
  });
});
