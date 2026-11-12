import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { DetailFrame } from "./DetailFrame";

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

describe("DetailFrame", () => {
  it("goes to its fallback when opened with no history, and shows its action and footer", () => {
    act(() =>
      root.render(
        <MemoryRouter initialEntries={["/detail"]}>
          <Routes>
            <Route
              path="/detail"
              element={
                <DetailFrame backTo="/list" action={<span>menu</span>} footer={<span>foot</span>}>
                  body
                </DetailFrame>
              }
            />
            <Route path="/list" element={<span>the list</span>} />
          </Routes>
        </MemoryRouter>
      )
    );
    expect(container.querySelector(".detail-bar")?.textContent).toContain("menu");
    expect(container.querySelector(".detail-footer")?.textContent).toBe("foot");
    act(() => container.querySelector<HTMLButtonElement>(".detail-back")!.click());
    expect(container.textContent).toBe("the list");
  });
});
