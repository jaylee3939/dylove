import React from "react";
import ReactDOM from "react-dom/client";
import Entry from "./Entry";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./styles/polaroid.css";
import "./styles/game.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Entry />
  </React.StrictMode>,
);
