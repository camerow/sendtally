import { randomUUID } from "expo-crypto";
import { useAddTo as useSharedAddTo, type AddFlow, type AddTo } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../plan/usePlanActions";
import { useReminderPrompt } from "../reminders/ReminderPromptProvider";

/** The shared add, with mobile's ids, plan writes and reminder prompt. */
export function useAddTo(flow: AddFlow): AddTo {
  const { today } = useHangData();
  return useSharedAddTo(useApi(), flow, today, {
    newId: randomUUID,
    actions: usePlanActions(),
    onAdded: useReminderPrompt(),
  });
}
