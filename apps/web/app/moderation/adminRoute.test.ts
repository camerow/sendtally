import { describe, expect, it } from "vitest";
import { moderationRedirect } from "./adminRoute";

const from = (search: string): string =>
  moderationRedirect(new URL(`https://sendtally.com/app/moderation${search}`));

describe("old moderation links", () => {
  it("land on the admin page that now holds them", () => {
    expect(from("")).toBe("/app/admin");
    expect(from("?tab=library")).toBe("/app/admin/library");
    expect(from("?tab=library&item=grip%3Ahalf")).toBe("/app/admin/library?item=grip%3Ahalf");
    expect(from("?tab=creations")).toBe("/app/admin/areas?tab=creations");
    expect(from("?tab=revisions")).toBe("/app/admin/areas?tab=revisions");
    expect(from("?tab=duplicates")).toBe("/app/admin/areas?tab=duplicates");
    expect(from("?tab=reports")).toBe("/app/admin/areas?tab=reports");
  });
});
