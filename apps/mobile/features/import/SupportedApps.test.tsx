import { describe, expect, it } from "@jest/globals";
import { linkHint } from "./SupportedApps";

describe("linkHint", () => {
  it("names a confirmed page by its site and a search by its query", () => {
    expect(linkHint("https://www.thecrag.com/en/article/exportlogbook")).toBe("thecrag.com");
    expect(linkHint("https://www.google.com/search?q=Kaya%20data%20export")).toBe(
      "Google: Kaya data export"
    );
  });
});
