import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SettingsProvider } from "./components/SettingsProvider";

import { BrowserRouter } from "react-router-dom";

// 🚀 Ghost UI Kill-Switch: Programmatically unregister all SWs in Dev to prevent "Old UI Flag"
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
            registration.unregister();
            console.log("🛠️ Dev Mode: Unregistered Ghost Service Worker to prevent UI cache flash.");
        }
    });
}

createRoot(document.getElementById("root")!).render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
    </BrowserRouter>
);
