import { StrictMode } from "react";
import { ViteReactSSG } from "vite-react-ssg/single-page";
import "./styles.css";
import { App } from "./App";

// Render at build time, then hydrate in the browser.
export const createRoot = ViteReactSSG(
  <StrictMode>
    <App />
  </StrictMode>,
);
