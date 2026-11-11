import { isSpecial1111Path } from "./routes";
import { lazy, Suspense } from "react";
const MainGame = lazy(() => import("./App"));
const Special1111 = lazy(() => import("./episodes/1111/Episode"));
export default function Entry() {
  return (
    <Suspense
      fallback={
        <div
          style={{ padding: 32, color: "#8e4058", fontFamily: "sans-serif" }}
        >
          우리의 이야기를 여는 중 ♡
        </div>
      }
    >
      {isSpecial1111Path(window.location.pathname) ? (
        <Special1111 />
      ) : (
        <MainGame />
      )}
    </Suspense>
  );
}
