/**
 * ARCHIVO PRINCIPAL DE LA APLICACIÓN - App.tsx
 *
 * Configura el enrutamiento de toda la aplicación y organiza la estructura
 * de rutas utilizando React Router y AppRoutes modularizado.
 *
 * @version 2.0.0
 */

import { BrowserRouter as Router } from "react-router";
import { AppRoutes } from "./routes";
import ToastContainer from "./components/ui/toast/ToastContainer";
import ScrollToTop from "./components/common/ScrollToTop";
import { ModalStackProvider } from "./components/ui/modal/ModalContext";
import { CommandPaletteProvider } from "./components/command-palette/CommandPaletteContext";
import CommandPalette from "./components/command-palette/CommandPalette";
import { useCommandPaletteEvents } from "./hooks/useCommandPaletteEvents";

/**
 * Componente interno que contiene el hook de eventos del CommandPalette
 */
function AppContent() {
  useCommandPaletteEvents();
  return <AppRoutes />;
}

/**
 * Componente raíz de la aplicación React
 * @function App
 * @returns {JSX.Element} Estructura completa de la aplicación con enrutamiento modularizado
 */
export default function App() {
  return (
    <CommandPaletteProvider>
      <ModalStackProvider>
        <ToastContainer />
        <ScrollToTop />
        <Router>
          <AppContent />
          <CommandPalette />
        </Router>
      </ModalStackProvider>
    </CommandPaletteProvider>
  );
}
