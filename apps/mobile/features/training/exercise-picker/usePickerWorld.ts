import {
  usePickerWorld as useWorld,
  type PickerOffer,
  type PickerWorld,
} from "@sendtally/features/exercises";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";

/** Everything the exercise library offers, with how often each was logged. */
export function usePickerWorld(inWorkout: readonly string[], offer: PickerOffer): PickerWorld {
  return useWorld(useApi(), useHangData().model, inWorkout, offer);
}
