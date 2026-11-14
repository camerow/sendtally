import React from "react";

export type BlockHeadProps = {
  kicker: string;
  /** Fern for a finished block; grey by default. */
  finished?: boolean;
  title: string;
  when: string;
};

/** A block's kicker, name and dates, as it reads outside Edit mode. */
export function BlockHead({
  kicker,
  finished = false,
  title,
  when,
}: BlockHeadProps): React.ReactElement {
  return (
    <div className="block-head">
      <span className={finished ? "train-label block-finished" : "train-label"}>{kicker}</span>
      <h1 className="block-title">{title}</h1>
      <span className="block-when">{when}</span>
    </div>
  );
}
