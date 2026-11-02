import type { PhotoAsset } from "./storage";
export async function optimizePhoto(file: File): Promise<PhotoAsset> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 25 * 1024 * 1024
  )
    throw Error("JPG·PNG·WebP 사진을 골라 주세요. 한 장은 25MB 이하여야 해요.");
  let image: ImageBitmap | HTMLImageElement;
  let temporaryURL: string | undefined;
  try {
    image = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    temporaryURL = URL.createObjectURL(file);
    image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(
          Error("사진을 읽지 못했어요. JPG·PNG·WebP 파일인지 확인해 주세요."),
        );
      element.src = temporaryURL!;
    }).catch((error) => {
      if (temporaryURL) URL.revokeObjectURL(temporaryURL);
      throw error;
    });
  }
  try {
    const width =
        image instanceof HTMLImageElement ? image.naturalWidth : image.width,
      height =
        image instanceof HTMLImageElement ? image.naturalHeight : image.height;
    if (!width || !height || width * height > 80_000_000)
      throw Error(
        "사진 해상도가 너무 커요. 8천만 화소 이하의 사진을 골라 주세요.",
      );
    let scale = Math.min(1, 1600 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    let blob: Blob | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw Error("이 브라우저에서 사진을 최적화하지 못했어요.");
      context.fillStyle = "#fff4e8";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/webp", attempt === 0 ? 0.86 : 0.8),
      );
      if (!blob) throw Error("사진을 변환하지 못했어요.");
      if (blob.type !== "image/webp")
        blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.86),
        );
      if (!blob) throw Error("사진을 변환하지 못했어요.");
      if (blob.size <= 600 * 1024) break;
      scale *= 0.82;
    }
    if (!blob || blob.size > 3 * 1024 * 1024)
      throw Error(
        "사진 크기를 충분히 줄이지 못했어요. 조금 작은 사진을 골라 주세요.",
      );
    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    return {
      path: `/memories/editor-${crypto.randomUUID()}.${extension}`,
      blob,
      width: canvas.width,
      height: canvas.height,
      originalName: file.name,
    };
  } finally {
    if ("close" in image && typeof image.close === "function") image.close();
    if (temporaryURL) URL.revokeObjectURL(temporaryURL);
  }
}
