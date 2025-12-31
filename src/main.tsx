import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import ErrorBoundary from "./components/common/ErrorBoundary.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="max-w-md rounded-md border border-red-200 bg-white p-6 shadow">
            <h1 className="mb-2 text-xl font-semibold text-red-600">Ha ocurrido un error inesperado.</h1>
            <p className="mb-4 text-sm text-gray-600">
              Intenta recargar la página o volver al inicio.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => location.reload()}
                className="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700"
              >
                Recargar
              </button>
              <a
                href="/"
                className="rounded border px-3 py-2 text-gray-700 hover:bg-gray-100"
              >
                Inicio
              </a>
            </div>
          </div>
        </div>
      }
    >
      <ThemeProvider>
        <AppWrapper>
          <App />
        </AppWrapper>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
