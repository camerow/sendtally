/** The picture files a moderator can add to the library, and the most one may weigh. */
export const PICTURE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type PictureType = (typeof PICTURE_TYPES)[number];

export const MAX_PICTURE_BYTES = 5 * 1024 * 1024;

const ascii = (bytes: Uint8Array, from: number, text: string): boolean =>
  [...text].every((ch, i) => bytes[from + i] === ch.charCodeAt(0));

/** What a file's first bytes say it is, whatever its name or declared type claim. */
export function pictureTypeOf(bytes: Uint8Array): PictureType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && ascii(bytes, 1, "PNG")) return "image/png";
  if (ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP")) return "image/webp";
  return null;
}

/** Why a picture cannot be added, in the line the moderation page shows, or null. */
export function pictureProblem(declared: string, size: number, head: Uint8Array): string | null {
  if (!(PICTURE_TYPES as readonly string[]).includes(declared) || pictureTypeOf(head) !== declared)
    return "Use JPEG, PNG or WebP";
  if (size > MAX_PICTURE_BYTES) return "Too large";
  return null;
}
