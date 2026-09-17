import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  DEFAULT_GRADE_PREFS,
  newClimb,
  withClimbKind,
  type ClimbDraft,
} from "@sendtally/features/log-session";
import { ClimbCard } from "./ClimbCard";
import { ClimbLedgerRow } from "./ClimbLedgerRow";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const boulder = (): ClimbDraft => newClimb("climb-1", "v");
const circuit = (): ClimbDraft => withClimbKind(boulder(), "endurance", DEFAULT_GRADE_PREFS, []);

function mount(climb: ClimbDraft, onChange: (climb: ClimbDraft) => void = () => {}): HTMLElement {
  act(() =>
    root.render(
      <ClimbCard
        climb={climb}
        gyms={[]}
        prefs={DEFAULT_GRADE_PREFS}
        removable
        project={false}
        suggestions={[]}
        onChange={onChange}
        onChangeName={() => {}}
        onPick={() => {}}
        onToggleProject={() => {}}
        onRemove={() => {}}
      />
    )
  );
  return container.querySelector(".climb-card")!;
}

function pick(select: HTMLSelectElement, value: string): void {
  act(() => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

/** React tracks the last value it wrote, so a typed value goes through the native setter. */
function type(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function byLabel(card: HTMLElement, label: string): HTMLSelectElement {
  return [...card.getElementsByTagName("select")].find(
    (select) => select.getAttribute("aria-label") === label
  )!;
}

function numbers(card: HTMLElement): HTMLInputElement[] {
  return [...card.querySelectorAll<HTMLInputElement>('input[type="number"]')];
}

describe("ClimbCard", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
  });

  it("turns a boulder into a circuit of laps from the type select", () => {
    const onChange = vi.fn();
    const card = mount(boulder(), onChange);
    pick(byLabel(card, "Type"), "endurance");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "send",
        style: "redpoint",
        tries: 1,
        endurance: { unit: "moves", target: 20, laps: [20] },
      })
    );
  });

  it("types a new lap target and cuts every lap down to it", () => {
    const onChange = vi.fn();
    const card = mount(circuit(), onChange);
    type(numbers(card)[0]!, "32");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ endurance: { unit: "moves", target: 32, laps: [20] } })
    );
  });

  it("steps the lap target with the number field", () => {
    const onChange = vi.fn();
    const card = mount(circuit(), onChange);
    const target = numbers(card)[0]!;
    expect(target.step).toBe("1");
    expect(target.max).toBe("3600");
    type(target, "21");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ endurance: expect.objectContaining({ target: 21 }) })
    );
  });

  it("adds a lap at the full length of the circuit", () => {
    const onChange = vi.fn();
    const card = mount(circuit(), onChange);
    act(() => {
      card.querySelector<HTMLButtonElement>(".lap-add")!.click();
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ endurance: { unit: "moves", target: 20, laps: [20, 20] } })
    );
  });

  it("marks the lap as fell after and takes how far it got", () => {
    const onChange = vi.fn();
    const card = mount(circuit(), onChange);
    const outcome = byLabel(card, "Lap 1");
    expect([...outcome.options].map((o) => o.text)).toEqual(["Completed", "Fell after"]);
    pick(outcome, "partial");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ endurance: { unit: "moves", target: 20, laps: [19] } })
    );

    const partial = mount({ ...circuit(), endurance: { unit: "moves", target: 20, laps: [19] } });
    expect(partial.textContent).toContain("/20 moves");
    expect(partial.textContent).toContain("19 of 20 moves");
    const fell = mount(
      { ...circuit(), endurance: { unit: "moves", target: 20, laps: [19] } },
      onChange
    );
    type(numbers(fell)[1]!, "12");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ endurance: { unit: "moves", target: 20, laps: [12] } })
    );
  });

  it("does not offer a circuit of laps as a project", () => {
    const card = mount({ ...circuit(), name: "Red 40" });
    expect(card.querySelector<HTMLButtonElement>(".climb-project")!.disabled).toBe(true);
  });

  it("keeps the project toggle live on a named boulder", () => {
    const card = mount({ ...boulder(), name: "The Crimp Thing" });
    expect(card.querySelector<HTMLButtonElement>(".climb-project")!.disabled).toBe(false);
  });

  it("switches the circuit to time and starts it over in minutes", () => {
    const onChange = vi.fn();
    const card = mount(circuit(), onChange);
    const unit = byLabel(card, "Unit");
    expect([...unit.options].map((o) => o.text)).toEqual(["Moves", "Time"]);
    pick(unit, "seconds");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ endurance: { unit: "seconds", target: 600, laps: [600] } })
    );
    const time = mount({ ...circuit(), endurance: { unit: "seconds", target: 600, laps: [600] } });
    expect(numbers(time)[0]!.value).toBe("10");
    expect(time.textContent).toContain("10 min of 10 min");
  });
});

describe("ClimbLedgerRow", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("reads a circuit of laps as its laps, with no result badge and no try count", () => {
    act(() =>
      root.render(
        <ClimbLedgerRow
          climb={{ ...circuit(), endurance: { unit: "moves", target: 32, laps: [32, 32, 24] } }}
          project={false}
          onPress={() => {}}
        />
      )
    );
    const row = container.querySelector(".climb-ledger-row")!;
    expect(row.textContent).toContain("Endurance");
    expect(row.textContent).toContain("3 laps · 88 of 96 moves");
    expect(row.querySelector(".climb-ledger-result")).toBeNull();
    expect(row.querySelector(".climb-ledger-tries")).toBeNull();
  });
});
