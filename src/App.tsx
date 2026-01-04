/**
 * ARCHIVO PRINCIPAL DE LA APLICACIÓN - App.jsx
 *
 * Este archivo es el punto de entrada principal de la aplicación React.
 * Configura el enrutamiento de toda la aplicación y organiza la estructura
 * de rutas utilizando React Router v6.
 *
 * @version 1.0.0
 * @author [Nombre del Desarrollador/Equipo]
 */

// ============================================================================
// IMPORTACIONES DE DEPENDENCIAS EXTERNAS
// ============================================================================

/**
 * React Router v6 - Sistema de enrutamiento para aplicaciones React
 * @module react-router
 * @description Proporciona componentes para manejar la navegación y rutas
 */
import { BrowserRouter as Router, Routes, Route } from "react-router";

// ============================================================================
// IMPORTACIONES DE COMPONENTES DE LAYOUT
// ============================================================================

/**
 * Layout principal de la aplicación
 * @module ./layout/AppLayout
 * @description Contiene la estructura común (sidebar, header, footer) para las páginas principales
 */
import AppLayout from "./layout/AppLayout";

/**
 * Componente utilitario para manejo del scroll
 * @module ./components/common/ScrollToTop
 * @description Restablece la posición del scroll al cambiar de ruta
 */
import { ScrollToTop } from "./components/common/ScrollToTop";

// ============================================================================
// IMPORTACIONES DE PÁGINAS - DASHBOARD
// ============================================================================

/**
 * Página principal del dashboard
 * @module ./pages/Dashboard/Home
 * @description Vista principal que muestra métricas, resúmenes y datos clave
 */
import Home from "./pages/Dashboard/Home";

// ============================================================================
// IMPORTACIONES DE PÁGINAS - AUTENTICACIÓN
// ============================================================================

/**
 * Página de inicio de sesión
 * @module ./pages/AuthPages/SignIn
 * @description Formulario para autenticación de usuarios existentes
 */
import SignIn from "./pages/AuthPages/SignIn";

/**
 * Página de registro de usuarios
 * @module ./pages/AuthPages/SignUp
 * @description Formulario para creación de nuevas cuentas de usuario
 */
import SignUp from "./pages/AuthPages/SignUp";

// ============================================================================
// IMPORTACIONES DE PÁGINAS - PERFILES Y UTILITARIOS
// ============================================================================

/**
 * Página de perfiles de usuario
 * @module ./pages/UserProfiles
 * @description Gestión y visualización de perfiles de usuarios
 */
import UserProfiles from "./pages/UserProfiles";

/**
 * Página de calendario
 * @module ./pages/Calendar
 * @description Componente de calendario para gestión de eventos y tareas
 */
import Calendar from "./pages/Calendar";

/**
 * Página en blanco
 * @module ./pages/Blank
 * @description Plantilla vacía para desarrollo o páginas en construcción
 */
import Blank from "./pages/Blank";
import Students from "./pages/Students/students";
import Tutors from "./pages/Tutors/tutors";
import ToastContainer from "./components/ui/toast/ToastContainer";

// ============================================================================
// IMPORTACIONES DE PÁGINAS - FORMULARIOS
// ============================================================================

/**
 * Componentes de formulario
 * @module ./pages/Forms/FormElements
 * @description Biblioteca de elementos de formulario reutilizables (inputs, selects, etc.)
 */
import FormElements from "./pages/Forms/FormElements";

// ============================================================================
// IMPORTACIONES DE PÁGINAS - TABLAS
// ============================================================================

/**
 * Tablas de datos básicas
 * @module ./pages/Tables/BasicTables
 * @description Componentes de tablas para visualización de datos estructurados
 */
import BasicTables from "./pages/Tables/BasicTables";

// ============================================================================
// IMPORTACIONES DE PÁGINAS - ELEMENTOS DE INTERFAZ (UI)
// ============================================================================

/**
 * Componentes de alerta/notificación
 * @module ./pages/UiElements/Alerts
 * @description Mensajes emergentes para notificaciones y feedback al usuario
 */
import Alerts from "./pages/UiElements/Alerts";

/**
 * Componentes de avatar
 * @module ./pages/UiElements/Avatars
 * @description Representaciones visuales de usuarios (fotos, iniciales, etc.)
 */
import Avatars from "./pages/UiElements/Avatars";

/**
 * Componentes de badges/etiquetas
 * @module ./pages/UiElements/Badges
 * @description Indicadores visuales para estados, categorías o contadores
 */
import Badges from "./pages/UiElements/Badges";

/**
 * Componentes de botones
 * @module ./pages/UiElements/Buttons
 * @description Diferentes estilos y tipos de botones interactivos
 */
import Buttons from "./pages/UiElements/Buttons";

/**
 * Componentes de imágenes
 * @module ./pages/UiElements/Images
 * @description Gestión y visualización de imágenes con diferentes opciones
 */
import Images from "./pages/UiElements/Images";

/**
 * Componentes de video
 * @module ./pages/UiElements/Videos
 * @description Reproductores y gestores de contenido multimedia
 */
import Videos from "./pages/UiElements/Videos";

// ============================================================================
// IMPORTACIONES DE PÁGINAS - GRÁFICOS
// ============================================================================

/**
 * Gráficos de línea
 * @module ./pages/Charts/LineChart
 * @description Visualizaciones de datos en formato de gráfico lineal
 */
import LineChart from "./pages/Charts/LineChart";

/**
 * Gráficos de barras
 * @module ./pages/Charts/BarChart
 * @description Visualizaciones de datos en formato de gráfico de barras
 */
import BarChart from "./pages/Charts/BarChart";

// ============================================================================
// IMPORTACIONES DE PÁGINAS - OTRAS
// ============================================================================

/**
 * Página 404 - No encontrada
 * @module ./pages/OtherPage/NotFound
 * @description Vista mostrada cuando una ruta no existe en la aplicación
 */
import NotFound from "./pages/OtherPage/NotFound";

// ============================================================================
// COMPONENTE PRINCIPAL DE LA APLICACIÓN
// ============================================================================

import Period from "./pages/Period/period";
// {Carreras}
import CareersPage from "./pages/Careers/careers";
import CrudExample from "./pages/Management/CrudExample";

/**
 * Componente raíz de la aplicación React
 * @function App
 * @returns {JSX.Element} Estructura completa de la aplicación con enrutamiento
 *
 * @description
 * Este componente configura todo el sistema de rutas de la aplicación.
 * Organiza las rutas en tres categorías principales:
 * 1. Rutas con Layout de Aplicación (requieren autenticación)
 * 2. Rutas de Autenticación (sin layout principal)
 * 3. Ruta de fallback (404)
 *
 * La estructura utiliza React Router v6 con el patrón de rutas anidadas.
 */
export default function App() {
  return (
    <>
      <ToastContainer />
      {/* 
        Router principal de la aplicación
        Envuelve toda la aplicación para habilitar el enrutamiento
      */}
      <Router>
        {/* 
          Componente que restablece el scroll al inicio de la página
          cada vez que cambia la ruta
        */}
        <ScrollToTop />

        {/* 
          Contenedor de rutas - Define todas las rutas de la aplicación
          Routes reemplaza al antiguo Switch de versiones anteriores
        */}
        <Routes>
          {/* ==================================================================
             GRUPO DE RUTAS CON LAYOUT DE APLICACIÓN
             ==================================================================
             Todas las rutas dentro de este grupo comparten:
             - El layout común (AppLayout) con sidebar, header, footer
             - Probablemente requieren autenticación para acceder
             - Tienen la misma estructura visual base
          */}
          <Route element={<AppLayout />}>
            {/* 
              Ruta de inicio (dashboard principal)
              @path / - Ruta raíz de la aplicación
              @element Home - Componente del dashboard principal
              @index true - Indica que es la ruta por defecto dentro del layout
            */}
            <Route index path="/" element={<Home />} />

            {/* ================================================================
               SECCIÓN: OTRAS PÁGINAS
               ================================================================
               Páginas diversas que no pertenecen a categorías específicas
            */}

            {/* Página de perfiles de usuario */}
            <Route path="/profile" element={<UserProfiles />} />

            {/* Página de calendario */}
            <Route path="/calendar" element={<Calendar />} />

            {/* Página en blanco (plantilla) */}
            <Route path="/blank" element={<Blank />} />

            {/* {Estudiantes} */}
            <Route path="/students" element={<Students />} />

            {/* {Tutores} */}
            <Route path="/tutors" element={<Tutors />} />
            {/* ================================================================
               SECCIÓN: FORMULARIOS
               ================================================================
               Páginas relacionadas con entrada de datos y formularios
            */}

            {/* Elementos de formulario */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* ================================================================
               SECCIÓN: TABLAS
               ================================================================
               Páginas para visualización de datos tabulares
            */}

            {/* Tablas básicas */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* {Periodo} */}
            <Route path="/period" element={<Period />} />

            {/* {Carreras} */}
            <Route path="/careers" element={<CareersPage />} />

            <Route path="/crud-example" element={<CrudExample />} />


            {/* ================================================================
               SECCIÓN: ELEMENTOS DE INTERFAZ (UI)
               ================================================================
               Biblioteca de componentes visuales reutilizables
            */}

            {/* Componentes de alerta */}
            <Route path="/alerts" element={<Alerts />} />

            {/* Componentes de avatar */}
            <Route path="/avatars" element={<Avatars />} />

            {/* Componentes de badges/etiquetas */}
            <Route path="/badge" element={<Badges />} />

            {/* Componentes de botones */}
            <Route path="/buttons" element={<Buttons />} />

            {/* Componentes de imágenes */}
            <Route path="/images" element={<Images />} />

            {/* Componentes de video */}
            <Route path="/videos" element={<Videos />} />

            {/* ================================================================
               SECCIÓN: GRÁFICOS
               ================================================================
               Páginas de visualización de datos y gráficos
            */}

            {/* Gráficos de línea */}
            <Route path="/line-chart" element={<LineChart />} />

            {/* Gráficos de barras */}
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>
          {/* FIN DEL GRUPO DE RUTAS CON LAYOUT DE APLICACIÓN */}

          {/* ==================================================================
             GRUPO DE RUTAS DE AUTENTICACIÓN
             ==================================================================
             Rutas públicas que NO usan el layout principal.
             Generalmente son páginas de login, registro, recuperación de contraseña, etc.
          */}

          {/* Página de inicio de sesión */}
          <Route path="/signin" element={<SignIn />} />

          {/* Página de registro */}
          <Route path="/signup" element={<SignUp />} />

          {/* ==================================================================
             RUTA DE FALLBACK (404)
             ==================================================================
             Ruta que captura todas las URLs no definidas anteriormente.
             DEBE ser la última ruta definida.
             
             @path * - Patrón comodín que coincide con cualquier ruta
             @element NotFound - Componente de página no encontrada
          */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        {/* FIN DEL CONTENEDOR DE RUTAS */}
      </Router>
      {/* FIN DEL ROUTER PRINCIPAL */}
    </>
  );
}

// ============================================================================
// NOTAS ADICIONALES Y CONSIDERACIONES
// ============================================================================

/**
 * ESTRUCTURA DE CARPETAS IMPLÍCITA:
 *
 * src/
 * ├── components/           # Componentes reutilizables
 * │   └── common/          # Componentes utilitarios comunes
 * │       └── ScrollToTop.jsx
 * ├── layout/              # Componentes de layout
 * │   └── AppLayout.jsx
 * └── pages/               # Páginas de la aplicación
 *     ├── AuthPages/       # Páginas de autenticación
 *     │   ├── SignIn.jsx
 *     │   └── SignUp.jsx
 *     ├── Dashboard/       # Páginas del dashboard
 *     │   └── Home.jsx
 *     ├── Forms/           # Páginas de formularios
 *     │   └── FormElements.jsx
 *     ├── Tables/          # Páginas de tablas
 *     │   └── BasicTables.jsx
 *     ├── UiElements/      # Componentes de interfaz
 *     │   ├── Alerts.jsx
 *     │   ├── Avatars.jsx
 *     │   ├── Badges.jsx
 *     │   ├── Buttons.jsx
 *     │   ├── Images.jsx
 *     │   └── Videos.jsx
 *     ├── Charts/          # Páginas de gráficos
 *     │   ├── LineChart.jsx
 *     │   └── BarChart.jsx
 *     ├── OtherPage/       # Páginas varias
 *     │   └── NotFound.jsx
 *     ├── UserProfiles.jsx
 *     ├── Calendar.jsx
 *     └── Blank.jsx
 */

/**
 * PATRONES DE DISEÑO IMPLEMENTADOS:
 *
 * 1. Layout Wrapper Pattern: Uso de AppLayout para compartir estructura común
 * 2. Route Grouping: Agrupación lógica de rutas relacionadas
 * 3. Code Splitting: Organización modular que facilita la división de código
 * 4. Protected Routes Pattern: Separación implícita de rutas públicas/privadas
 * 5. Error Boundary: Manejo elegante de rutas no existentes
 */

/**
 * CONSIDERACIONES DE MEJORA FUTURA:
 *
 * 1. Implementar lazy loading para optimizar el rendimiento:
 *    const Home = React.lazy(() => import('./pages/Dashboard/Home'));
 *
 * 2. Añadir protección de rutas con autenticación:
 *    <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
 *
 * 3. Crear múltiples layouts para diferentes secciones
 *
 * 4. Implementar sistema de breadcrumbs dinámicos
 *
 * 5. Añadir análisis de rutas para tracking de usuarios
 */

/**
 * FLUJO DE NAVEGACIÓN TÍPICO:
 *
 * 1. Usuario no autenticado → /signin o /signup
 * 2. Autenticación exitosa → redirección a / (Home dentro de AppLayout)
 * 3. Navegación entre páginas → todas mantienen AppLayout
 * 4. Ruta no existente → muestra componente NotFound
 */

/**
 * VERSIONES COMPATIBLES:
 *
 * React: ^18.0.0
 * React Router: ^6.0.0
 *
 * Este archivo utiliza la sintaxis de React Router v6 que introduce
 * cambios significativos respecto a versiones anteriores:
 * - <Routes> reemplaza a <Switch>
 * - <Route element> reemplaza a <Route component> y <Route render>
 * - Rutas anidadas con <Route> dentro de <Route>
 */
