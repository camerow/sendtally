import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Description } from "./Description";

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
  vi.restoreAllMocks();
});

const mount = (node: React.ReactNode): void => act(() => root.render(node));
const texts = (): string[] =>
  [...container.querySelectorAll(".desc-text")].map((el) => el.textContent ?? "");

/** Lays each paragraph out at the lines its text asks for, as "3:" before it says. */
const layOut = (): void => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement
  ) {
    const n = Number(/^(\d+):/.exec(this.textContent ?? "")?.[1] ?? 1);
    return { height: n * 22 } as DOMRect;
  });
};

describe("Description", () => {
  it("renders nothing for an empty description", () => {
    mount(<Description text=" " fold />);
    expect(container.innerHTML).toBe("");
  });

  it("shows bullets, steps and links that open the whole address in a new tab", () => {
    mount(
      <Description text={"- Brace\n1. Hang\nSee https://www.sendtally.com/training/hangboard"} />
    );
    expect(container.querySelector(".desc-bullet")?.textContent).toBe("•");
    expect(container.querySelector(".desc-step")?.textContent).toBe("1.");
    const link = container.querySelector<HTMLAnchorElement>("a.desc-link")!;
    expect(link.textContent).toBe("sendtally.com/training/…");
    expect(link.href).toBe("https://www.sendtally.com/training/hangboard");
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener noreferrer");
  });

  it("folds past five lines behind More, clamping the paragraph that crosses", () => {
    layOut();
    mount(<Description text={"2: One\n\n4: Two\n\n1: Three"} fold />);
    expect(texts()).toEqual(["2: One", "4: Two"]);
    const two = container.querySelectorAll<HTMLElement>(".desc-text")[1]!;
    expect(two.classList.contains("desc-clamp")).toBe(true);
    expect(two.style.webkitLineClamp).toBe("3");
    const more = container.querySelector<HTMLButtonElement>(".desc-more")!;
    expect(more.textContent).toBe("More");
    act(() => more.click());
    expect(texts()).toEqual(["2: One", "4: Two", "1: Three"]);
    expect(more.textContent).toBe("Less");
    act(() => more.click());
    expect(texts()).toHaveLength(2);
  });

  it("has no More when it all fits, nor in a sheet", () => {
    layOut();
    mount(<Description text={"2: One\n\n3: Two"} fold />);
    expect(container.querySelector(".desc-more")).toBeNull();
    mount(<Description text={"9: One\n\n3: Two"} />);
    expect(texts()).toHaveLength(2);
    expect(container.querySelector(".desc-more")).toBeNull();
  });
});
