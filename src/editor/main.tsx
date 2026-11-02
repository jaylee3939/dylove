import { createRoot } from "react-dom/client";
import Editor from "./Editor";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "../styles/polaroid.css";
import "./editor.css";
if (import.meta.env.DEV && import.meta.env.MODE === "editor")
  createRoot(document.getElementById("root")!).render(<Editor />);
