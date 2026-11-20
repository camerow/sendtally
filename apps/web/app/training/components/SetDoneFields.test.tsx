import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { SetDone } from "@sendtally/core/hang";
import { SetDoneFields } from "./SetDoneFields";

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

const held = (set: SetDone): HTMLInputElement => {
  act(() =>
    root.render(
      <SetDoneFields
        set={set}
        hangs
        oneHang
        unit="kg"
        label="Half crimp set 1"
        onChange={() => {}}
      />
    )
  );
  return container.querySelector("input")!;
};

describe("SetDoneFields, a set of one hang", () => {
  it("reads the time a hang that ran was held", () => {
    expect(held({ reps: 1, onS: 10 }).value).toBe("00:10");
  });

  it("leaves a hang never reached empty, as the phone does, rather than 00:00", () => {
    const input = held({ reps: 0, onS: 10 });
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("–");
  });
});
