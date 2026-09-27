import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { ProgressProvider } from "./store/ProgressContext.jsx";
import "./styles/app.css";

// Hash routing keeps deep links working on any static host without rewrites.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </HashRouter>
  </StrictMode>
);
