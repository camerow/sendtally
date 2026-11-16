/** The longest side of a library picture, and the side of its square thumbnail. */
const LONG_SIDE = 1600;
const THUMB_SIDE = 144;

const jpeg = (canvas: HTMLCanvasElement, name: string): Promise<File> =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob === null
          ? reject(new Error("Could not read this picture"))
          : resolve(new File([blob], name, { type: "image/jpeg" })),
      "image/jpeg",
      0.85
    )
  );

function drawn(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  [sx, sy, sw, sh]: [number, number, number, number]
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  return canvas;
}

/**
 * A picked picture as the library stores it: a JPEG no larger than 1600 px on its long side, and
 * its centre cropped to a 144 px square. Made in the browser, so the Worker never resizes.
 */
export async function resizedPicture(
  file: File
): Promise<{ picture: File; thumb: File; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONG_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const side = Math.min(bitmap.width, bitmap.height);
  const square: [number, number, number, number] = [
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
  ];
  const [picture, thumb] = await Promise.all([
    jpeg(drawn(bitmap, width, height, [0, 0, bitmap.width, bitmap.height]), "picture.jpg"),
    jpeg(drawn(bitmap, THUMB_SIDE, THUMB_SIDE, square), "thumb.jpg"),
  ]);
  bitmap.close();
  return { picture, thumb, width, height };
}
