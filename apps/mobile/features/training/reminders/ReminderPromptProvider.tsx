import { useAuth } from "@clerk/clerk-expo";
import React from "react";
import { TrainingReminders } from "./TrainingReminders";

const PromptContext = React.createContext<() => void>(() => undefined);
const OpenContext = React.createContext(false);

/** Asks to remind on training days, once, the first time something goes on the plan. */
export function useReminderPrompt(): () => void {
  return React.useContext(PromptContext);
}

/** Whether the prompt is up, as a toast waits for it to close. */
export function useReminderPromptOpen(): boolean {
  return React.useContext(OpenContext);
}

/** Wraps the whole app, so a plan saved from any screen can ask. */
export function ReminderPromptProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { isSignedIn } = useAuth();
  const [asked, setAsked] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const ask = React.useCallback(() => setAsked(true), []);

  return (
    <PromptContext.Provider value={ask}>
      <OpenContext.Provider value={open}>{children}</OpenContext.Provider>
      {isSignedIn === true && (
        <TrainingReminders
          asked={asked}
          onAnswered={() => setAsked(false)}
          onOpenChange={setOpen}
        />
      )}
    </PromptContext.Provider>
  );
}
