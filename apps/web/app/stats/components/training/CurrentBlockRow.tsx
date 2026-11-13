import React from "react";
import { Link } from "react-router";
import { currentBlockLine, useTrainingLog } from "@sendtally/features/training";
import { useAppApi } from "../../../lib/useAppApi";
import { blockPath } from "../../../training/blocks/paths";
import { useHangData } from "../../../training/data/HangDataContext";

/** The block running today, how far in and how much of it is done, opening it; nothing outside a block. */
export function CurrentBlockRow(): React.ReactElement | null {
  const { today } = useHangData();
  const { log } = useTrainingLog(useAppApi());
  const line = currentBlockLine(log, today);
  if (line === null) return null;
  const { block, meta } = line;
  return (
    <Link to={blockPath(block.id)} className="current-block" aria-label={`${block.name}, ${meta}`}>
      <span className="current-block-name">{block.name}</span>
      <span className="stats-meta">{meta}</span>
    </Link>
  );
}
