import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { HistoryItem } from "@sendtally/features/activities";
import { HistoryList } from "./HistoryList";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const item = (n: number, extra: Partial<HistoryItem> = {}): HistoryItem => ({
  id: `s${n}`,
  date: `Nov ${n}`,
  name: `Session ${n}`,
  meta: "",
  rpe: n === 1 ? 7 : null,
  ...extra,
});

function mount(items: HistoryItem[]): void {
  act(() =>
    root.render(
      <MemoryRouter>
        <HistoryList items={items} to={(id) => `/app/sessions/${id}`} />
      </MemoryRouter>
    )
  );
}

describe("HistoryList", () => {
  it("links each row, shows five, then the rest on asking", () => {
    mount([1, 2, 3, 4, 5, 6, 7].map((n) => item(n)));
    const links = (): HTMLAnchorElement[] => Array.from(container.querySelectorAll("a"));
    expect(links()).toHaveLength(5);
    expect(links()[0]?.getAttribute("href")).toBe("/app/sessions/s1");
    expect(container.textContent).toContain("RPE 7");
    const more = container.querySelector<HTMLButtonElement>(".detail-more")!;
    expect(more.textContent).toBe("Show all 7");
    act(() => more.click());
    expect(links()).toHaveLength(7);
  });

  it("does not link the current row or one that does not open", () => {
    mount([item(1, { current: true }), item(2, { opens: false }), item(3)]);
    expect(container.querySelectorAll("a")).toHaveLength(1);
    expect(container.querySelector(".history-row--current")).not.toBeNull();
  });

  it("is left out when the only row is the current one", () => {
    mount([item(1, { current: true })]);
    expect(container.innerHTML).toBe("");
  });
});
