import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EditorApp } from "./EditorApp";

createRoot(document.querySelector<HTMLDivElement>("#app")!).render(
  <StrictMode>
    <EditorApp />
  </StrictMode>,
);
