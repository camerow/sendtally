import { router } from "expo-router";
import type { WorkoutKind } from "@sendtally/core/hang";

/** A new workout's editor: the hangboard builder, or the workout editor for the kind. */
export function openEditor(kind: WorkoutKind): void {
  if (kind === "hangboard") router.push("/workout/builder");
  else router.push({ pathname: "/workout/edit", params: { kind } });
}
