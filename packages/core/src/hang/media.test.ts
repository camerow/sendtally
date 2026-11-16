import { describe, expect, it } from "vitest";
import { MAX_PICTURE_BYTES, pictureProblem, pictureTypeOf } from "./media";

const bytes = (...parts: (number[] | string)[]): Uint8Array =>
  Uint8Array.from(
    parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p))
  );

const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0]);
const PNG = bytes([0x89], "PNG\r\n");
const WEBP = bytes("RIFF", [0, 0, 0, 0], "WEBP");

describe("pictures", () => {
  it("knows a file by its first bytes", () => {
    expect(pictureTypeOf(JPEG)).toBe("image/jpeg");
    expect(pictureTypeOf(PNG)).toBe("image/png");
    expect(pictureTypeOf(WEBP)).toBe("image/webp");
    expect(pictureTypeOf(bytes("GIF89a"))).toBeNull();
  });

  it("takes JPEG, PNG and WebP up to the limit, and nothing that only claims to be one", () => {
    expect(pictureProblem("image/jpeg", 1000, JPEG)).toBeNull();
    expect(pictureProblem("image/webp", MAX_PICTURE_BYTES, WEBP)).toBeNull();
    expect(pictureProblem("image/heic", 1000, JPEG)).toBe("Use JPEG, PNG or WebP");
    expect(pictureProblem("image/png", 1000, JPEG)).toBe("Use JPEG, PNG or WebP");
    expect(pictureProblem("image/jpeg", MAX_PICTURE_BYTES + 1, JPEG)).toBe("Too large");
  });
});
