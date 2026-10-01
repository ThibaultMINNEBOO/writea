import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { Providers } from "@/app/providers";
import { router } from "@/app/router";
import { listenForInstallPrompt } from "@/features/pwa/install-prompt";
import { monitorConnectivity } from "@/lib/connectivity";
import "./index.css";

listenForInstallPrompt();
monitorConnectivity();

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable");

createRoot(root).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
