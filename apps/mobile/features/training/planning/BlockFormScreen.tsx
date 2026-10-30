import React from "react";
import { isDated } from "@sendtally/core/hang";
import { usePlan } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { LoadState } from "../data/LoadState";
import { BlockForm } from "./BlockForm";

export type BlockFormScreenProps = {
  id: string;
  /** A plan just added, lit for a moment. */
  highlight?: string;
};

/** Editing a scheduled block. */
export function BlockFormScreen({
  id,
  highlight,
}: BlockFormScreenProps): React.ReactElement | null {
  const { state, reload } = usePlan(useApi());
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  const block = state.data.blocks.find((b) => b.id === id);
  return block === undefined || !isDated(block) ? null : (
    <BlockForm initial={block} highlight={highlight} />
  );
}
