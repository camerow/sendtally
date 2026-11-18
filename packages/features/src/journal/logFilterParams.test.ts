import { describe, expect, it } from "vitest";
import { NO_LOG_FILTER, updateLogFilter } from "./logFilter";
import { logFilterFromParams, writeLogFilterParams } from "./logFilterParams";
import type { LogFilter } from "./types";

const roundTrip = (filter: LogFilter): LogFilter => {
  const params = new URLSearchParams();
  writeLogFilterParams(params, filter);
  return logFilterFromParams(new URLSearchParams(params.toString()));
};

describe("Log filter params", () => {
  it("round-trips every filter through a link", () => {
    const filter: LogFilter = {
      ...NO_LOG_FILTER,
      show: ["climbing", "training"],
      when: "y2025",
      effort: { lo: 6, hi: 8 },
      tags: ["comp-prep"],
      discipline: "boulder",
      grade: { scale: "font", from: "6B+", to: "7A" },
      outcome: "sent",
      setting: "indoor",
      place: "gym-1",
      categories: ["hangboard", "strength"],
      exercise: "half crimp",
      block: "winter",
      workout: "title:max hangs",
      foci: ["power_endurance"],
    };
    expect(roundTrip(filter)).toEqual(filter);
  });

  it("writes nothing for no filter, and keeps other params", () => {
    const params = new URLSearchParams("tab=x&status=sent");
    writeLogFilterParams(params, NO_LOG_FILTER);
    expect(params.toString()).toBe("tab=x");
  });

  it("reads the old links: /app?status=projects and a Stats workout", () => {
    const projects = logFilterFromParams(new URLSearchParams("status=projects"));
    expect(projects.outcome).toBe("projects");
    expect(projects.show).toEqual(["climbing"]);
    expect(logFilterFromParams(new URLSearchParams("workout=max")).workout).toBe("max");
  });

  it("leaves out what it cannot read", () => {
    const filter = logFilterFromParams(
      new URLSearchParams("show=climbing,nope&when=2y&effort=9-3&grade=v:V4:Z9&status=x&focus=yoga")
    );
    expect(filter).toEqual({ ...NO_LOG_FILTER, show: ["climbing"] });
  });

  it("keeps a link's filter as the sheet would set it", () => {
    const filter = updateLogFilter(NO_LOG_FILTER, { outcome: "projects" });
    expect(roundTrip(filter).show).toEqual(["climbing"]);
  });
});
