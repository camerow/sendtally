import { describe, expect, it, vi } from "vitest";
import type { ConnectionStatus, FirstRunStep } from "@sendtally/api-client";
import { DEFAULT_GRADE_SCALES } from "../settings/transforms";
import type { Capture, OnboardingProgress, OnboardingStatus, PathFrom } from "./types";
import { announceOpen, openWizard, patchStatus, wizardOf } from "./wizardState";

const NONE: OnboardingProgress = {
  sessions: false,
  exercises: false,
  workouts: false,
  blockMemberships: false,
  scheduledBlocks: false,
};

type Setup = {
  onboarding?: Partial<OnboardingStatus>;
  start?: { path: "history" | "plan"; from: PathFrom };
};

function setup({ onboarding: given = {}, start }: Setup = {}): {
  wizard: () => ReturnType<typeof wizardOf>;
  announce: () => void;
  capture: ReturnType<typeof vi.fn<Capture>>;
  send: ReturnType<typeof vi.fn<(to: FirstRunStep) => void>>;
} {
  const onboarding: OnboardingStatus = { path: null, left: false, progress: NONE, ...given };
  const capture = vi.fn<Capture>();
  const send = vi.fn<(to: FirstRunStep) => void>();
  let state = openWizard(onboarding, { progress: onboarding.progress }, start);
  const deps = {
    progress: onboarding.progress,
    capture,
    send,
    update: (change: (s: typeof state) => typeof state): void => {
      state = change(state);
    },
  };
  return {
    wizard: () => wizardOf(state, deps),
    announce: () => announceOpen(state, onboarding, start, deps),
    capture,
    send,
  };
}

describe("opening the wizard", () => {
  it("shows the chooser and says it started", () => {
    const { wizard, announce, send } = setup();
    expect(wizard().step).toBe("choose");
    expect(wizard().position).toEqual({ n: 0, total: 0 });
    announce();
    expect(send).toHaveBeenCalledExactlyOnceWith({ step: "started" });
  });

  it("reopens a path under way at its first step not done, and sends nothing", () => {
    const { wizard, announce, send } = setup({
      onboarding: { path: "plan", progress: { ...NONE, workouts: true } },
    });
    expect(wizard().step).toBe("P1w");
    announce();
    expect(send).not.toHaveBeenCalled();
    wizard().back();
    expect(wizard().step).toBe("choose");
  });

  it("opens the asked path from the setup card and counts a resume of a path left", () => {
    const start = { path: "plan", from: "setup_card" } as const;
    const progress = { ...NONE, workouts: true, blockMemberships: true, scheduledBlocks: true };
    const { wizard, announce, send, capture } = setup({
      onboarding: { path: "plan", left: true, progress },
      start,
    });
    expect(wizard().step).toBe("P5");
    announce();
    expect(send).toHaveBeenCalledExactlyOnceWith({ step: "path", ...start });
    expect(capture).toHaveBeenCalledExactlyOnceWith("onboarding_resumed", {
      path: "plan",
      at: "P5",
    });
    wizard().back();
    expect(wizard().step).toBe("P5");
  });

  it("does not count a path opened from Account as a resume", () => {
    const { announce, capture } = setup({ start: { path: "history", from: "account" } });
    announce();
    expect(capture).not.toHaveBeenCalled();
  });
});

describe("the history path", () => {
  it("goes from the chooser through the import to the end, with no membership step", () => {
    const { wizard, send, capture } = setup();
    wizard().choose("history", "chooser");
    expect(send).toHaveBeenLastCalledWith({ step: "path", path: "history", from: "chooser" });
    expect(wizard()).toMatchObject({ path: "history", step: "H1" });

    wizard().answerLog("kaya");
    expect(send).toHaveBeenLastCalledWith({ step: "log_answered", existingLog: "kaya" });
    expect(wizard().memory).toMatchObject({ way: "import", existingLog: "kaya" });
    expect(wizard().position).toEqual({ n: 1, total: 3 });

    const visited = [wizard().step];
    for (let i = 0; i < 4; i++) {
      wizard().next();
      visited.push(wizard().step);
    }
    expect(visited).toEqual(["H1", "H2i", "H3i", "H4", "H6"]);
    expect(wizard().position).toEqual({ n: 3, total: 3 });
    expect(capture).toHaveBeenCalledWith("onboarding_step_completed", {
      path: "history",
      step: "H1",
    });
    expect(capture.mock.calls.some(([event]) => event === "paywall_shown")).toBe(false);
  });

  it("goes by hand for a first log, and carries a step's extra on its event", () => {
    const { wizard, capture } = setup();
    wizard().choose("history", "chooser");
    wizard().answerLog("none");
    expect(wizard().memory.way).toBe("by_hand");
    wizard().next();
    expect(wizard().step).toBe("H2h");
    wizard().next({ count: 3, sends: 2 });
    expect(wizard().step).toBe("H4");
    expect(capture).toHaveBeenLastCalledWith("onboarding_step_completed", {
      path: "history",
      step: "H2h",
      count: 3,
      sends: 2,
    });
  });

  it("shows history as three fixed stages whichever way it goes", () => {
    const { wizard } = setup();
    wizard().choose("history", "chooser");
    expect(wizard().position).toEqual({ n: 1, total: 3 });
    wizard().answerLog("none");
    wizard().next();
    expect(wizard()).toMatchObject({ step: "H2h", position: { n: 2, total: 3 } });
    wizard().next();
    expect(wizard()).toMatchObject({ step: "H4", position: { n: 3, total: 3 } });
  });

  it("turns from the import's how-to to adding climbs by hand", () => {
    const { wizard, capture } = setup();
    wizard().choose("history", "chooser");
    wizard().answerLog("kaya");
    wizard().next();
    expect(wizard().step).toBe("H2i");
    wizard().setWay("by_hand");
    wizard().next({ way: "by_hand" });
    expect(wizard().step).toBe("H2h");
    expect(capture).toHaveBeenLastCalledWith("onboarding_step_completed", {
      path: "history",
      step: "H2i",
      way: "by_hand",
    });
  });

  it("goes back the way it came, to the chooser", () => {
    const { wizard } = setup();
    wizard().choose("history", "chooser");
    wizard().answerLog("8a");
    wizard().next();
    wizard().back();
    expect(wizard().step).toBe("H1");
    wizard().back();
    expect(wizard().step).toBe("choose");
  });
});

describe("the reveal", () => {
  it("is counted once a walk, not again when it comes back from a side step", () => {
    const { wizard, capture } = setup({ start: { path: "plan", from: "chooser" } });
    const viewed = { path: "plan", weeks: 4, sessions_planned: 8, reminders: "off" } as const;
    wizard().capture("onboarding_reveal_viewed", viewed);
    wizard().open("P4");
    wizard().next();
    wizard().capture("onboarding_reveal_viewed", viewed);
    expect(capture.mock.calls.filter(([event]) => event === "onboarding_reveal_viewed")).toEqual([
      ["onboarding_reveal_viewed", viewed],
    ]);
  });
});

describe("the plan path", () => {
  it("builds the week, then shows the plan, the builder and Shape the weeks only as side steps", () => {
    const { wizard, capture } = setup();
    wizard().choose("plan", "chooser");
    expect(wizard()).toMatchObject({ step: "P1w", position: { n: 1, total: 2 } });

    wizard().open("P2");
    expect(wizard()).toMatchObject({ step: "P2", canGoBack: true, position: { n: 0, total: 0 } });
    wizard().next();
    expect(wizard().step).toBe("P1w");
    expect(capture).toHaveBeenLastCalledWith("onboarding_step_completed", {
      path: "plan",
      step: "P2",
    });

    wizard().next({ count: 2, sessions: 3, own: 1 });
    expect(wizard().step).toBe("P5");
    wizard().open("P4");
    wizard().back();
    expect(wizard().step).toBe("P5");
    wizard().open("P4");
    wizard().next({ count: 2, shortcut: "both" });
    expect(wizard().step).toBe("P5");
    wizard().next();
    expect(wizard().step).toBe("P7");
    wizard().back();
    expect(wizard().step).toBe("P5");
    wizard().back();
    expect(wizard().step).toBe("P1w");
    expect(capture.mock.calls.map(([, p]) => "step" in p && p.step)).toEqual([
      "P2",
      "P1w",
      "P4",
      "P5",
    ]);
  });
});

describe("closing the wizard", () => {
  it("skips at the chooser with no path", () => {
    const { wizard, send } = setup();
    wizard().skip();
    expect(send).toHaveBeenCalledExactlyOnceWith({ step: "skipped", path: null, at: "choose" });
  });

  it("skips mid-path at the step it is on", () => {
    const { wizard, send } = setup();
    wizard().choose("plan", "chooser");
    wizard().open("P2");
    wizard().skip();
    expect(send).toHaveBeenLastCalledWith({ step: "skipped", path: "plan", at: "P2" });
  });

  it("leaves mid-path keeping the path", () => {
    const { wizard, send } = setup();
    wizard().choose("plan", "chooser");
    wizard().leave();
    expect(send).toHaveBeenLastCalledWith({ step: "left", path: "plan" });
  });

  it("completes into the other path", () => {
    const { wizard, send } = setup();
    wizard().choose("history", "chooser");
    wizard().answerLog("none");
    for (let i = 0; i < 3; i++) wizard().next();
    expect(wizard().step).toBe("H6");

    wizard().complete("later", "other_path");
    expect(send).toHaveBeenLastCalledWith({
      step: "completed",
      path: "history",
      outcome: "later",
      next: "other_path",
    });
    wizard().choose("plan", "end_screen");
    expect(send).toHaveBeenLastCalledWith({ step: "path", path: "plan", from: "end_screen" });
    expect(wizard()).toMatchObject({ path: "plan", step: "P1w", position: { n: 1, total: 2 } });
    wizard().next();
    expect(wizard()).toMatchObject({ step: "P5", position: { n: 2, total: 2 } });
    wizard().next();
    expect(wizard().step).toBe("P7");
  });
});

describe("patchStatus", () => {
  const status: ConnectionStatus = {
    gradeScales: DEFAULT_GRADE_SCALES,
    role: "user",
    trainingReminders: { enabled: false, time: "08:00", promptSeen: false },
    firstRun: true,
    onboarding: { path: null, left: false, progress: NONE },
    strava: null,
  };

  it("sets the path when one is chosen and keeps the gate open", () => {
    expect(patchStatus(status, { step: "path", path: "plan", from: "chooser" })).toMatchObject({
      firstRun: true,
      onboarding: { path: "plan", left: false },
    });
  });

  it("closes the gate on leave and keeps the path as left", () => {
    const chosen = { ...status, onboarding: { ...status.onboarding, path: "plan" as const } };
    expect(patchStatus(chosen, { step: "left", path: "plan" })).toMatchObject({
      firstRun: false,
      onboarding: { path: "plan", left: true },
    });
  });

  it("clears the path and closes the gate on skip and on a completion that ends", () => {
    const left = {
      ...status,
      onboarding: { path: "history" as const, left: true, progress: NONE },
    };
    const closed = { firstRun: false, onboarding: { path: null, left: false } };
    expect(patchStatus(left, { step: "skipped", path: "history", at: "H2h" })).toMatchObject(
      closed
    );
    expect(
      patchStatus(left, { step: "completed", path: "history", outcome: "member", next: "log" })
    ).toMatchObject(closed);
  });

  it("keeps the wizard open on a completion into the other path", () => {
    const to: FirstRunStep = {
      step: "completed",
      path: "history",
      outcome: "later",
      next: "other_path",
    };
    expect(patchStatus(status, to)).toBe(status);
  });
});

describe("two actions in one handler", () => {
  it("lands both, as H1 does with answerLog then next", () => {
    const { wizard } = setup();
    wizard().choose("history", "chooser");
    const held = wizard();
    held.answerLog("kaya");
    held.next({ way: "import" });
    expect(wizard().step).toBe("H2i");
  });
});
