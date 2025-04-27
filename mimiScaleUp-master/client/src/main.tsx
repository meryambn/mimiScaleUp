import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./scrollbar.css";
import "./App.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Error boundary for the entire app
function startApp() {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }

    // Remove loading indicator when app is ready
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      rootElement.removeChild(loadingElement);
    }

    createRoot(rootElement).render(
      <DndProvider backend={HTML5Backend}>
        <App />
      </DndProvider>
    );

    console.log("App mounted successfully");
  } catch (error) {
    console.error("Failed to start application:", error);

    // Show error in UI
    const errorMsg = document.getElementById("error-message");
    if (errorMsg) {
      errorMsg.style.display = "block";
      errorMsg.textContent = `Failed to initialize app: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

// Initialize the app with a small delay to ensure DOM is ready
setTimeout(startApp, 100);
