import React from "react";
import { usePlan } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { BlockForm } from "./BlockForm";

export type BlockFormScreenProps = {
  /** The block to edit; without it a new one. */
  id?: string;
};

const DEFAULT_WEEKS = 4;

/** New block, or editing one. */
export function BlockFormScreen({ id }: BlockFormScreenProps): React.ReactElement | null {
  const { today } = useHangData();
  const { state, reload } = usePlan(useApi());
  if (id === undefined)
    return (
      <BlockForm initial={{ id: "", name: "", start: today, weeks: DEFAULT_WEEKS, focus: null }} />
    );
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  const block = state.data.blocks.find((b) => b.id === id);
  return block === undefined ? null : <BlockForm initial={block} />;
}
