import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Route, Routes } from "react-router";
import { TestRouter } from "../../lib/TestRouter";
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
  description: "",
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
        <TestRouter initialEntries={["/app/train", "/edit"]} initialIndex={1}>
          <WithHang data={hangData({ sessions: [aHang()] })} actions={{ saveGrip: state.saveGrip }}>
            <Routes>
              <Route path="/edit" element={page} />
              <Route path="*" element={<p data-left>left</p>} />
            </Routes>
          </WithHang>
        </TestRouter>
      </ToastProvider>
    )
  );
}

const type = (el: HTMLInputElement | HTMLTextAreaElement, value: string): void =>
  act(() => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
    Object.getOwnPropertyDescriptor(proto.prototype, "value")!.set!.call(el, value);
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
    type(container.querySelector<HTMLTextAreaElement>(".name-field")!, "  Sled push ");
    await act(async () => save.click());
    expect(state.make).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Sled push", kind: "strength" })
    );
  });

  it("warns before changing how a logged exercise is measured", async () => {
    mount(<ExerciseEditorPage exercise="s" />);
    expect(container.querySelector<HTMLTextAreaElement>(".name-field")?.value).toBe(
      "Zercher squat"
    );
    click(radio("Reps"));
    click(container.querySelector(".detail-primary"));
    expect(state.saveExercise).not.toHaveBeenCalled();
    await act(async () => document.querySelector<HTMLElement>(".sheet-action--danger")?.click());
    expect(state.saveExercise).toHaveBeenCalledWith(
      "s",
      expect.objectContaining({ measure: "reps" })
    );
  });

  it("writes the exercise's description, trimmed, but none for a grip", async () => {
    mount(<ExerciseEditorPage exercise="s" />);
    const field = container.querySelector<HTMLTextAreaElement>("textarea.form-notes")!;
    expect(field.maxLength).toBe(2000);
    type(field, " Sit back.\n\n- Brace ");
    await act(async () => container.querySelector<HTMLElement>(".detail-primary")?.click());
    expect(state.saveExercise).toHaveBeenCalledWith(
      "s",
      expect.objectContaining({ description: "Sit back.\n\n- Brace" })
    );
    act(() => root.render(<></>));
    mount(<ExerciseEditorPage grip="half" />);
    expect(container.querySelector("textarea.form-notes")).toBeNull();
  });

  it("locks a built-in grip's name", () => {
    mount(<ExerciseEditorPage grip="half" />);
    const name = container.querySelector<HTMLTextAreaElement>(".name-field")!;
    expect(name.readOnly).toBe(true);
    expect(container.querySelector(".name-locked")).not.toBeNull();
  });
});
