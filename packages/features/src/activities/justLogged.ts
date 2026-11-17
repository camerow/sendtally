import React from "react";
import { t } from "../i18n";

/** A workout or activity a review just saved, told once wherever the app lands next. */
export type JustLogged = { id: string; name: string };

let current: JustLogged | null = null;
const listeners = new Set<() => void>();
const notify = (): void => listeners.forEach((l) => l());

export const justLogged = {
  tell: (logged: JustLogged): void => {
    current = logged;
    notify();
  },
  clear: (): void => {
    current = null;
    notify();
  },
  read: (): JustLogged | null => current,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
};

export function useJustLogged(): JustLogged | null {
  return React.useSyncExternalStore(justLogged.subscribe, justLogged.read, justLogged.read);
}

/** "Logged Back squat, alternating" */
export const justLoggedText = (logged: JustLogged): string =>
  t("activities.loggedName", { name: logged.name });
