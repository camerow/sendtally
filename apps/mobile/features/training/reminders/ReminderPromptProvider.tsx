import { useAuth } from "@clerk/clerk-expo";
import React from "react";
import { TrainingReminders } from "./TrainingReminders";

const PromptContext = React.createContext<() => void>(() => undefined);

/** Asks to remind on training days, once, the first time something goes on the plan. */
export function useReminderPrompt(): () => void {
  return React.useContext(PromptContext);
}

/** Wraps the whole app, so a plan saved from any screen can ask. */
export function ReminderPromptProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { isSignedIn } = useAuth();
  const [asked, setAsked] = React.useState(false);
  const ask = React.useCallback(() => setAsked(true), []);

  return (
    <PromptContext.Provider value={ask}>
      {children}
      {isSignedIn === true && (
        <TrainingReminders asked={asked} onAnswered={() => setAsked(false)} />
      )}
    </PromptContext.Provider>
  );
}
