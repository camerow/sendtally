import React from "react";
import { Description } from "../components/Description";

export type BlockHeadProps = {
  kicker: string;
  /** Fern for a finished block; grey by default. */
  finished?: boolean;
  title: string;
  when: string;
  /** What the block is for, folded under its dates; none when empty. */
  description?: string;
};

/** A block's kicker, name and dates, as it reads outside Edit mode. */
export function BlockHead({
  kicker,
  finished = false,
  title,
  when,
  description = "",
}: BlockHeadProps): React.ReactElement {
  return (
    <div className="block-head">
      <span className={finished ? "train-label block-finished" : "train-label"}>{kicker}</span>
      <h1 className="block-title">{title}</h1>
      <span className="block-when">{when}</span>
      {description !== "" && (
        <div className="block-desc">
          <Description text={description} fold />
        </div>
      )}
    </div>
  );
}
