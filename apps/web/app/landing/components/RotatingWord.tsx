import React from "react";

export type RotatingWordProps = {
  words: readonly string[];
  index: number;
  className?: string;
};

export function RotatingWord({
  words,
  index,
  className = "l-word-slot",
}: RotatingWordProps): React.ReactElement {
  const word = words[index] ?? words[0] ?? "";
  return (
    <span className={className}>
      <span key={word} className="l-word">
        {word}
      </span>
    </span>
  );
}
