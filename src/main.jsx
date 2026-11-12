import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/cyrillic-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/cyrillic-500.css";
import "@fontsource/cormorant-garamond/latin-500-italic.css";
import "@fontsource/cormorant-garamond/cyrillic-500-italic.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/cormorant-garamond/cyrillic-600.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/cyrillic-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/cyrillic-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/cyrillic-600.css";
import "@fontsource/great-vibes/latin-400.css";
import "@fontsource/great-vibes/cyrillic-400.css";
import "@fontsource/noto-sans-symbols-2/symbols-400.css";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
