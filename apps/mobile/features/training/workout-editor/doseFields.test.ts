import { describe, expect, it } from "@jest/globals";
import { DOSE_FIELDS_OF, fieldText, withField } from "./doseFields";

const [hangs, hang, rest, sets] = DOSE_FIELDS_OF.hangboard;
const [, , weight] = DOSE_FIELDS_OF.strength;

describe("dose fields", () => {
  it("reads times as seconds or m:ss, and weights in the user's unit", () => {
    expect(fieldText(hang!, { sets: 1, onS: 7 }, "kg")).toBe("7");
    expect(fieldText(rest!, { sets: 1, offS: 180 }, "kg")).toBe("3:00");
    expect(fieldText(weight!, { sets: 1, weightKg: 100 }, "lb")).toBe("220.5");
    expect(fieldText(hangs!, { sets: 1 }, "kg")).toBe("");
    expect(fieldText(weight!, { sets: 1, weightKg: -20 }, "kg")).toBe("−20");
    expect(withField({ sets: 1 }, weight!, "−20", "kg")).toEqual({ sets: 1, weightKg: -20 });
  });

  it("takes typed numbers, clears optional fields, and refuses what is not a number", () => {
    expect(withField({ sets: 1 }, rest!, "1:30", "kg")).toEqual({ sets: 1, offS: 90 });
    expect(withField({ sets: 1, onS: 7 }, hang!, " ", "kg")).toEqual({ sets: 1 });
    expect(withField({ sets: 3 }, sets!, "", "kg")).toBeNull();
    expect(withField({ sets: 3 }, sets!, "0", "kg")).toEqual({ sets: 1 });
    expect(withField({ sets: 3 }, hangs!, "six", "kg")).toBeNull();
  });
});
