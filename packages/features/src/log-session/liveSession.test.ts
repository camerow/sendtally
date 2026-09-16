import type { ClimbSummary } from "@sendtally/api-client";
import { describe, expect, it } from "vitest";
import {
  defaultSessionName,
  idleMinutes,
  liveDraft,
  wantsWrapUpReminder,
  withClimbName,
  withClimbTouched,
  withQuickClimb,
} from "./liveSession";

const EVENING = new Date(2026, 8, 16, 18, 42);

describe("live session", () => {
  it("names the session by time of day and date", () => {
    expect(defaultSessionName(new Date(2026, 8, 12, 9, 0))).toBe("Morning session, 9/12/26");
    expect(defaultSessionName(new Date(2026, 8, 12, 14, 0))).toBe("Afternoon session, 9/12/26");
    expect(defaultSessionName(EVENING)).toBe("Evening session, 9/16/26");
  });

  it("starts a session at the first climb and ends it at the latest", () => {
    const first = withQuickClimb(null, EVENING);
    expect(first.key).toBe("climb-1");
    expect(first.draft.startTime).toBe("18:42");
    expect(first.draft.endTime).toBe("18:42");
    expect(first.draft.climbs).toHaveLength(1);

    const second = withQuickClimb(first.draft, new Date(2026, 8, 16, 19, 31));
    expect(second.key).toBe("climb-2");
    expect(second.draft.startTime).toBe("18:42");
    expect(second.draft.endTime).toBe("19:31");
    expect(second.draft.climbs[1]?.scale).toBe(first.draft.climbs[0]?.scale);
  });

  it("moves the end time when a climb is revisited the same day only", () => {
    const draft = liveDraft(EVENING);
    expect(withClimbTouched(draft, new Date(2026, 8, 16, 20, 5)).endTime).toBe("20:05");
    expect(withClimbTouched(draft, new Date(2026, 8, 17, 8, 0)).endTime).toBe("18:42");
    const nextDay = withQuickClimb(
      withQuickClimb(null, EVENING).draft,
      new Date(2026, 8, 17, 8, 0)
    );
    expect(nextDay.draft.endTime).toBe("18:42");
    expect(nextDay.draft.climbs).toHaveLength(2);
  });

  it("reminds after two idle hours, and always on a later day", () => {
    const { draft } = withQuickClimb(null, EVENING);
    expect(idleMinutes(draft, new Date(2026, 8, 16, 19, 42))).toBe(60);
    expect(wantsWrapUpReminder(draft, new Date(2026, 8, 16, 19, 42))).toBe(false);
    expect(wantsWrapUpReminder(draft, new Date(2026, 8, 16, 20, 42))).toBe(true);
    expect(wantsWrapUpReminder(draft, new Date(2026, 8, 17, 7, 0))).toBe(true);
    expect(wantsWrapUpReminder(liveDraft(EVENING), new Date(2026, 8, 17, 7, 0))).toBe(false);
  });

  it("adopts a known climb's grade on a typed name and keeps it otherwise", () => {
    const climb = withQuickClimb(null, EVENING).draft.climbs[0]!;
    const known: ClimbSummary = {
      slug: "orange-crimp-arete",
      name: "Orange crimp arete",
      grade: { scale: "v", value: 6 },
      discipline: "boulder",
      project: true,
      sessions: 4,
      attempts: 11,
      sends: 0,
      first_at: "2026-06-03T18:00:00.000Z",
      last_at: "2026-09-04T18:00:00.000Z",
    };
    expect(withClimbName({ ...climb, project: true }, "Ora", undefined)).toMatchObject({
      name: "Ora",
      grade: climb.grade,
      project: undefined,
    });
    expect(withClimbName(climb, known.name, known).grade).toBe("V6");
  });
});
