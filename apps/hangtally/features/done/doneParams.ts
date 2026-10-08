import type { Href } from "expo-router";
import type { RunResult } from "@sendtally/core/hang";

export type DoneParams = {
  workoutId: string;
  gripId: string;
  loadKg: number;
  result: RunResult;
};

type RawParams = Partial<Record<string, string | string[]>>;

/** The finished run, carried to the Session done screen in its route params. */
export function donePath({ workoutId, gripId, loadKg, result }: DoneParams): Href {
  return {
    pathname: "/done",
    params: {
      workoutId,
      gripId,
      loadKg: String(loadKg),
      ended: result.ended ? "1" : "0",
      setsDone: String(result.setsDone),
      pct: String(result.pct),
      work: String(result.work),
      misses: String(result.misses),
      seconds: String(result.seconds),
    },
  };
}

const num = (v: string | string[] | undefined): number => Number(Array.isArray(v) ? v[0] : v) || 0;
const str = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

export function readDoneParams(p: RawParams): DoneParams {
  return {
    workoutId: str(p.workoutId),
    gripId: str(p.gripId),
    loadKg: num(p.loadKg),
    result: {
      ended: str(p.ended) === "1",
      setsDone: num(p.setsDone),
      pct: num(p.pct),
      work: num(p.work),
      misses: num(p.misses),
      seconds: num(p.seconds),
    },
  };
}
