import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { setLocale } from "@sendtally/features/i18n";
import { RungEditor } from "./RungEditor";

const wallTime = { exercise: "Circuit", dose: { sets: 1, onS: 1200, offS: 60 } };

async function renderWeek(onChange: (change: object) => void): Promise<void> {
  await render(
    <RungEditor
      kind="climbing"
      item={wallTime}
      change={{ onS: 1200 }}
      unit="kg"
      onChange={onChange}
    />
  );
}

afterEach(() => setLocale("en"));

describe("RungEditor", () => {
  it.each<["en" | "de", string, string]>([
    ["en", "Work", "Done"],
    ["de", "Belastung", "Fertig"],
  ])(
    "keeps a 20 minute wall time when its field is opened and closed (%s)",
    async (locale, work, done) => {
      setLocale(locale);
      const onChange = jest.fn();
      await renderWeek(onChange);
      await fireEvent.press(screen.getByLabelText(work));
      await fireEvent.press(screen.getByLabelText(done));
      expect(onChange).not.toHaveBeenCalled();
    }
  );

  it("types a week's wall time as HH:MM:SS", async () => {
    const onChange = jest.fn();
    await renderWeek(onChange);
    expect(screen.getByLabelText("Work").props.accessibilityValue).toEqual({ text: "00:20:00" });
    for (const key of ["Work", "2", "5", "0", "0", "Done"])
      await fireEvent.press(screen.getByLabelText(key));
    expect(onChange).toHaveBeenCalledWith({ onS: 1500 });
  });
});
