import type { Content } from "../../content/defaults";
import {
  createPhotoBundle,
  readPhotoBundle,
  photoPaths,
} from "../../content/photoBundle";
import { getAsset, putAssets, type PhotoAsset } from "./storage";
export async function exportPhotoBundle(content: Content) {
  const images = new Map<string, Uint8Array>();
  for (const path of photoPaths(content)) {
    const local = await getAsset(path);
    let blob: Blob;
    if (local) blob = local.blob;
    else {
      const response = await fetch(path, { credentials: "omit" });
      if (
        !response.ok ||
        !response.headers.get("Content-Type")?.startsWith("image/")
      )
        throw Error(
          "연결된 사진을 찾지 못했어요. 빠진 사진을 다시 선택해 주세요.",
        );
      blob = await response.blob();
    }
    images.set(path, new Uint8Array(await blob.arrayBuffer()));
  }
  return createPhotoBundle(content, images);
}
export async function importPhotoBundle(file: File): Promise<Content> {
  if (file.size > 30 * 1024 * 1024)
    throw Error("ZIP 파일은 30MB 이하여야 해요.");
  const { content, images } = readPhotoBundle(
    new Uint8Array(await file.arrayBuffer()),
  );
  const assets: PhotoAsset[] = [];
  for (const [path, bytes] of images) {
    const type = /\.webp$/i.test(path)
      ? "image/webp"
      : /\.png$/i.test(path)
        ? "image/png"
        : "image/jpeg";
    const blob = new Blob([new Uint8Array(bytes).buffer], { type });
    let width = 0,
      height = 0;
    try {
      if (typeof createImageBitmap === "function") {
        const image = await createImageBitmap(blob);
        width = image.width;
        height = image.height;
        image.close();
      } else {
        const url = URL.createObjectURL(blob);
        try {
          const image = await new Promise<HTMLImageElement>(
            (resolve, reject) => {
              const el = new Image();
              el.onload = () => resolve(el);
              el.onerror = reject;
              el.src = url;
            },
          );
          width = image.naturalWidth;
          height = image.naturalHeight;
        } finally {
          URL.revokeObjectURL(url);
        }
      }
    } catch {
      throw Error(
        "묶음 안의 사진을 읽지 못했어요. 원래 편집기에서 다시 내보내 주세요.",
      );
    }
    if (!width || !height || width * height > 80_000_000)
      throw Error("묶음 안의 사진 해상도가 너무 커요.");
    assets.push({
      path,
      blob,
      width,
      height,
      originalName: path.split("/").pop()!,
    });
  }
  await putAssets(assets);
  return content;
}
