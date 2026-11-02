export type PhotoAsset = {
  path: string;
  blob: Blob;
  width: number;
  height: number;
  originalName: string;
};
const DB_NAME = "doyeon-private-photo-assets-v1";
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("assets", { keyPath: "path" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        Error(
          "사진 저장 공간을 열지 못했어요. 브라우저 저장 권한을 확인해 주세요.",
        ),
      );
  });
}
export async function putAssets(assets: PhotoAsset[]): Promise<void> {
  if (!assets.length) return;
  const fresh: PhotoAsset[] = [];
  for (const asset of assets) {
    const existing = await getAsset(asset.path);
    if (!existing) {
      fresh.push(asset);
      continue;
    }
    const before = new Uint8Array(await existing.blob.arrayBuffer()),
      after = new Uint8Array(await asset.blob.arrayBuffer());
    if (
      before.length !== after.length ||
      !before.every((byte, i) => byte === after[i])
    )
      throw Error(
        "같은 이름의 다른 사진이 있어요. 기존 사진은 보존했어요. 편집기에서 사진을 새로 선택해 주세요.",
      );
  }
  if (!fresh.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("assets", "readwrite");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(Error("사진을 보관하지 못했어요. 저장 공간을 확인해 주세요."));
    };
    tx.onabort = () => {
      db.close();
      reject(Error("사진 저장이 취소됐어요. 저장 공간을 확인해 주세요."));
    };
    for (const asset of fresh) tx.objectStore("assets").add(asset);
  });
}
export async function getAsset(path: string): Promise<PhotoAsset | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("assets", "readonly"),
      request = tx.objectStore("assets").get(path);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(Error("사진을 읽지 못했어요."));
    tx.oncomplete = () => db.close();
  });
}
