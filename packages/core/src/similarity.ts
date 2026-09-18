export const DUPLICATE_THRESHOLD = 0.6;

function trigrams(key: string): Set<string> {
  const padded = ` ${key} `;
  const grams = new Set<string>();
  for (let i = 0; i + 3 <= padded.length; i++) grams.add(padded.slice(i, i + 3));
  return grams;
}

export function nameSimilarity(a: string, b: string): number {
  if (a === "" || b === "") return 0;
  const left = trigrams(a);
  const right = trigrams(b);
  let shared = 0;
  for (const gram of left) if (right.has(gram)) shared++;
  return (2 * shared) / (left.size + right.size);
}

export function isLikelyDuplicate(nameKey: string, candidateKey: string): boolean {
  if (nameKey === "") return false;
  return nameKey === candidateKey || nameSimilarity(nameKey, candidateKey) >= DUPLICATE_THRESHOLD;
}
