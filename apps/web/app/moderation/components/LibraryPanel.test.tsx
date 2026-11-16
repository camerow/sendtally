import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BuiltInLibrary, SendtallyApi } from "@sendtally/api-client";
import { TEST_LIBRARY } from "@sendtally/features/library/testing";
import { LibraryPanel } from "./LibraryPanel";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const library: BuiltInLibrary = {
  ...TEST_LIBRARY,
  grips: TEST_LIBRARY.grips.map((g) =>
    g.id === "half"
      ? {
          ...g,
          description: "Index to ring.",
          translations: { de: { name: "Halbe Leiste" }, fr: { name: "Demi-arquée" } },
        }
      : g.id === "mono"
        ? { ...g, status: "retired" as const }
        : g
  ),
};

const api = {
  saveLibraryEntry: vi.fn(async () => ({})),
  libraryChanges: vi.fn(async () => ({
    changes: [
      {
        id: "c1",
        changedBy: "Will",
        changedAt: "2026-11-14T14:02:00Z",
        before: { name: "Half crimp", description: "", translations: {}, status: "active" },
        after: {
          name: "Half crimp",
          description: "Index to ring.",
          translations: {},
          status: "active",
        },
      },
    ],
  })),
  restoreLibraryChange: vi.fn(async () => ({})),
} as unknown as SendtallyApi;

const opened = { item: null as string | null };

const mount = (item: string | null): void => {
  opened.item = item;
  act(() =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <LibraryPanel
          api={api}
          library={library}
          item={item}
          onOpen={(next) => (opened.item = next)}
        />
      </QueryClientProvider>
    )
  );
};

const button = (label: string): HTMLButtonElement =>
  [...container.querySelectorAll("button")].find((b) => b.textContent?.startsWith(label))!;
const type = (el: HTMLInputElement | HTMLTextAreaElement, value: string): void => {
  const proto = Object.getPrototypeOf(el) as object;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("LibraryPanel", () => {
  it("lists built-ins by group with what each lacks, and filters", () => {
    mount(null);
    const groups = [...container.querySelectorAll(".mod-lib-group")].map((g) => g.textContent);
    expect(groups[0]).toMatch(/^Workouts · /);
    expect(groups[1]).toBe(`Fingers exercises · ${library.grips.length - 1}`);
    const half = button("Half crimp");
    expect(half.textContent).toContain("✓ 1 paragraph");
    expect(half.textContent).toContain("Seeded");
    act(() => button("Retired").click());
    expect(
      [...container.querySelectorAll("button.mod-lib-row")].map((r) => r.firstChild?.textContent)
    ).toEqual(["Mono"]);
    act(() => button("Mono").click());
    expect(opened.item).toBe("grip:mono");
  });

  it("edits one in place: a new English name empties the other names, and Save sends it", async () => {
    mount("grip:half");
    expect(container.querySelector("h2")?.textContent).toBe("Half crimp");
    expect(container.querySelector(".mod-lib-fold summary")?.textContent).toBe(
      "Other languages · 2 names"
    );
    expect(button("Save").style.pointerEvents).toBe("none");
    type(container.querySelector<HTMLInputElement>("#library-name")!, "Half crimp, open thumb");
    expect(container.querySelector(".mod-lib-fold summary")?.textContent).toBe(
      "Other languages · 0 names"
    );
    type(container.querySelector<HTMLTextAreaElement>("#library-description")!, "- Index\n- Ring");
    expect(container.querySelector(".mod-lib-preview .desc-bullet")).not.toBeNull();
    await act(async () => button("Save").click());
    expect(api.saveLibraryEntry).toHaveBeenCalledWith("grip", "half", {
      name: "Half crimp, open thumb",
      description: "- Index\n- Ring",
      names: {},
      status: "active",
    });
  });

  it("lists changes with Restore, and retires after asking", async () => {
    mount("grip:half");
    await vi.waitFor(() => expect(container.querySelector(".mod-lib-change")).not.toBeNull());
    expect(container.querySelector(".mod-lib-change")?.textContent).toContain("Description edited");
    await act(async () => button("Restore").click());
    expect(api.restoreLibraryChange).toHaveBeenCalledWith("c1");
    act(() => button("Retire").click());
    expect(document.body.textContent).toContain("Retire Half crimp?");
  });
});
