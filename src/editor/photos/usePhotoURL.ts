import { useEffect, useState } from "react";
import { getAsset } from "./storage";
export function usePhotoURL(path: string | null) {
  const [url, setURL] = useState<string | null>(null);
  useEffect(() => {
    let active = true,
      objectURL: string | undefined;
    setURL(null);
    if (path)
      void getAsset(path)
        .then((asset) => {
          if (!active) return;
          if (asset) {
            objectURL = URL.createObjectURL(asset.blob);
            setURL(objectURL);
          } else setURL(path);
        })
        .catch(() => {
          if (active) setURL(path);
        });
    return () => {
      active = false;
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [path]);
  return url;
}
