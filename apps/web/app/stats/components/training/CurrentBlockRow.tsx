import React from "react";
import { currentBlockLine, useTrainingLog } from "@sendtally/features/training";
import { useAppApi } from "../../../lib/useAppApi";
import { useHangData } from "../../../training/data/HangDataContext";

/** The block running today, how far in and how much of it is done; nothing outside a block. */
export function CurrentBlockRow(): React.ReactElement | null {
  const { today } = useHangData();
  const { log } = useTrainingLog(useAppApi());
  const line = currentBlockLine(log, today);
  if (line === null) return null;
  const { block, meta } = line;
  return (
    <div className="current-block">
      <span className="current-block-name">{block.name}</span>
      <span className="stats-meta">{meta}</span>
    </div>
  );
}
