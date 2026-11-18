import React from "react";

let lastKey = 0;
const freshKeys = (count: number): number[] => Array.from({ length: count }, () => ++lastKey);

/**
 * A stable key per typed line, so a line put in under another gets its own input, which focus can
 * move to, and the rows below keep theirs. Lines changed in number from outside start over.
 */
export function useLineKeys(count: number): {
  keys: number[];
  insertAfter: (at: number) => number;
} {
  const [keys, setKeys] = React.useState(() => freshKeys(count));
  if (keys.length !== count) setKeys(freshKeys(count));
  const insertAfter = (at: number): number => {
    const key = ++lastKey;
    setKeys((k) => [...k.slice(0, at + 1), key, ...k.slice(at + 1)]);
    return key;
  };
  return { keys, insertAfter };
}
