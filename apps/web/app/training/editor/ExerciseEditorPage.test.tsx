import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import type { Exercise } from "@sendtally/api-client";
import type * as Exercises from "@sendtally/features/exercises";
import type * as Statistics from "@sendtally/features/statistics";
import { ToastProvider } from "../../components/Toast";
import { aHang, hangData, WithHang } from "../data/testHang";
import { ExerciseEditorPage } from "./ExerciseEditorPage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const squat: Exercise = {
  id: "s",
  name: "Zercher squat",
  kind: "strength",
  measure: "repsWeight",
  eachSide: false,
  progress: null,
  builtIn: null,
  archived: false,
};

const state = vi.hoisted(() => ({
  make: vi.fn(async () => ({ exercise: { id: "new" } })),
  saveExercise: vi.fn(async () => ({})),
  saveGrip: vi.fn(async () => undefined),
}));

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({ saveExercise: state.saveExercise }) }));
vi.mock("./useMake", () => ({ useMake: () => state.make }));
vi.mock("@sendtally/features/exercises", async (actual) => ({
  ...(await actual<typeof Exercises>()),
  useExerciseActions: () => ({ merge: vi.fn(), remove: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@sendtally/features/statistics", async (actual) => ({
  ...(await actual<typeof Statistics>()),
  useExercises: () => ({ state: { status: "ready", data: [squat] }, reload: vi.fn() }),
  useExerciseSeries: () => ({
    status: "ready",
    data: [{ key: "zercher squat", sessions: [] }],
  }),
}));

let container: HTMLDivElement;
let root: Root;

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

function mount(page: React.ReactNode): void {
  act(() =>
    root.render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/app/train", "/edit"]} initialIndex={1}>
          <WithHang data={hangData({ sessions: [aHang()] })} actions={{ saveGrip: state.saveGrip }}>
            <Routes>
              <Route path="/edit" element={page} />
              <Route path="*" element={<p data-left>left</p>} />
            </Routes>
          </WithHang>
        </MemoryRouter>
      </ToastProvider>
    )
  );
}

const type = (el: HTMLInputElement, value: string): void =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
const click = (el: Element | null | undefined): void => act(() => (el as HTMLElement).click());
const radio = (label: string): HTMLElement | undefined =>
  [...container.querySelectorAll<HTMLElement>('[role="radio"]')].find(
    (r) => r.textContent === label
  );

describe("ExerciseEditorPage", () => {
  it("makes a new exercise from its form, which saves only once named", async () => {
    mount(<ExerciseEditorPage making="strength" name="" />);
    const save = container.querySelector<HTMLButtonElement>(".detail-primary")!;
    expect(save.disabled).toBe(true);
    type(container.querySelector<HTMLInputElement>(".name-field")!, "  Sled push ");
    await act(async () => save.click());
    expect(state.make).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Sled push", kind: "strength" })
    );
  });

  it("warns before changing how a logged exercise is measured", () => {
    mount(<ExerciseEditorPage exercise="s" />);
    expect(container.querySelector<HTMLInputElement>(".name-field")?.value).toBe("Zercher squat");
    click(radio("Reps"));
    click(container.querySelector(".detail-primary"));
    expect(state.saveExercise).not.toHaveBeenCalled();
    click(document.querySelector(".sheet-action--danger"));
    expect(state.saveExercise).toHaveBeenCalledWith(
      "s",
      expect.objectContaining({ measure: "reps" })
    );
  });

  it("locks a built-in grip's name", () => {
    mount(<ExerciseEditorPage grip="half" />);
    const name = container.querySelector<HTMLInputElement>(".name-field")!;
    expect(name.readOnly).toBe(true);
    expect(container.querySelector(".name-locked")).not.toBeNull();
  });
});
