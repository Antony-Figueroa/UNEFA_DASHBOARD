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

/**
 * Componente raíz de la aplicación React
 * @function App
 * @returns {JSX.Element} Estructura completa de la aplicación con enrutamiento modularizado
 */
export default function App() {
  return (
    <>
      <ToastContainer />
      <Router>
        <AppRoutes />
      </Router>
    </>
  );
}
