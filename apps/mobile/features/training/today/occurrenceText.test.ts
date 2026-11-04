import { expect, it } from "@jest/globals";
import { unbrokenSegments } from "./occurrenceText";

it("joins the words of each segment so a kicker wraps only at its separators", () => {
  expect(unbrokenSegments("Up today · Climbing · Week 1 of 6")).toBe(
    "Up\u00A0today · Climbing · Week\u00A01\u00A0of\u00A06"
  );
});
