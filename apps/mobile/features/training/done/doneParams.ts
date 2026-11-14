import type { Href } from "expo-router";
import { doneParams, type DoneParams } from "@sendtally/features/workouts";

/** A hangboard workout's review, carried in its route params. */
export const donePath = (p: DoneParams): Href => ({
  pathname: "/workout/done",
  params: doneParams(p),
});
