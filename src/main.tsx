import { initThemeMode } from "flowbite-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ThemeInit } from "../.flowbite-react/init";
import App from "./App.tsx";
import "./index.css";

// ใช้ base จาก Vite (ตั้งใน vite.config.ts เป็น '/admin/')
// แล้วตัดสแลชท้ายออก เพื่อให้ basename ถูกต้อง
const basename = (import.meta.env.BASE_URL || "/admin/").replace(/\/$/, "");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeInit />
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

initThemeMode();
