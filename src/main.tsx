import { StrictMode } from "react";
import { ViteReactSSG } from "vite-react-ssg/single-page";
import "./styles.css";
import { App } from "./App";

// Single-page SSG: the tree is rendered to static HTML at build time and
// hydrated in the browser. No per-request server — output stays a static folder.
export const createRoot = ViteReactSSG(
  <StrictMode>
    <App />
  </StrictMode>,
);
