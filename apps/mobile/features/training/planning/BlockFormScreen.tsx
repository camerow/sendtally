import React from "react";
import { isCalendarDate, maxDate } from "@sendtally/core/hang";
import { usePlan } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { BlockForm } from "./BlockForm";

export type BlockFormScreenProps = {
  /** The block to edit; without it a new one. */
  id?: string;
  start?: string;
  weeks?: string;
};

const DEFAULT_WEEKS = 4;

/** New block, optionally from a start and a number of weeks, or editing one. */
export function BlockFormScreen({
  id,
  start,
  weeks,
}: BlockFormScreenProps): React.ReactElement | null {
  const { today } = useHangData();
  const { state, reload } = usePlan(useApi());
  if (id === undefined) {
    const n = Number(weeks);
    return (
      <BlockForm
        initial={{
          id: "",
          name: "",
          start: start !== undefined && isCalendarDate(start) ? maxDate(start, today) : today,
          weeks: Number.isInteger(n) && n >= 1 && n <= 16 ? n : DEFAULT_WEEKS,
        }}
      />
    );
  }
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  const block = state.data.blocks.find((b) => b.id === id);
  return block === undefined ? null : <BlockForm initial={block} />;
}
