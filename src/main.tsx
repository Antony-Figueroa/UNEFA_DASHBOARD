import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { DbStatusProvider } from "./context/DbStatusContext.tsx";
import ErrorBoundary from "./components/common/ErrorBoundary.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg-secondary dark:bg-bg-dark">
          <div className="max-w-md rounded-md border border-error-200 bg-bg-main p-6 shadow-theme-md dark:border-border-dark dark:bg-bg-dark">
            <h1 className="mb-2 text-xl font-semibold text-error-600">Ha ocurrido un error inesperado.</h1>
            <p className="mb-4 text-sm text-text-secondary dark:text-text-tertiary">
              Intenta recargar la página o volver al inicio.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => location.reload()}
                className="rounded bg-error-600 px-3 py-2 text-white hover:bg-error-700 transition-colors"
              >
                Recargar
              </button>
              <a
                href="/"
                className="rounded border border-border-light px-3 py-2 text-text-primary hover:bg-bg-secondary dark:border-border-dark dark:text-text-tertiary dark:hover:bg-white/5 transition-colors"
              >
                Inicio
              </a>
            </div>
          </div>
        </div>
      }
    >
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <DbStatusProvider>
              <AppWrapper>
                <App />
              </AppWrapper>
            </DbStatusProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
