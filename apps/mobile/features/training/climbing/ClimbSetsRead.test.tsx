import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { ClimbSetsRead } from "./ClimbSetsRead";

describe("ClimbSetsRead", () => {
  it("reads each set's climbs as a row: grade or circuit, attempts, and sent", async () => {
    await render(
      <ClimbSetsRead
        sets={[
          {
            climbs: [
              { grade: "V4", scale: "v", tries: 1, sent: true, style: "flash" },
              { grade: "6a", scale: "font", tries: 3, sent: false, name: "The prow" },
            ],
          },
          {
            climbs: [
              {
                grade: "",
                scale: "v",
                tries: 2,
                sent: true,
                circuit: { id: "c1", label: "Blue", colour: "blue" },
              },
            ],
          },
        ]}
      />
    );
    expect(screen.getByText("Set 1")).toBeTruthy();
    expect(screen.getByText("Set 2")).toBeTruthy();
    expect(screen.getByText("V4")).toBeTruthy();
    expect(screen.getByText("1 attempt · sent")).toBeTruthy();
    expect(screen.getByText("V3")).toBeTruthy();
    expect(screen.getByText("The prow")).toBeTruthy();
    expect(screen.getByText("3 attempts")).toBeTruthy();
    expect(screen.getByText("Blue")).toBeTruthy();
    expect(screen.getByText("2 attempts · sent")).toBeTruthy();
  });
});
