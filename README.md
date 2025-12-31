# TailAdmin — Plantilla React Admin Dashboard

TailAdmin es una plantilla moderna y gratuita para construir paneles de administración y aplicaciones SaaS con **React**, **Tailwind CSS v4** y **Vite**. Este README ofrece una documentación completa para comprender la arquitectura del proyecto, el flujo del sistema, las tecnologías utilizadas y los pasos para extender y mantener el código.

## Índice

1. Estructura del proyecto
2. Tecnologías y configuraciones
3. Guía de comprensión del código
4. Flujo de trabajo del sistema
5. Instrucciones para desarrollo
6. Scripts y requisitos
7. Personalización de UI (Tailwind v4)
8. Licencia

---

## 1. Estructura del proyecto

Arquitectura basada en características y capas compartidas. Los módulos clave y su ubicación exacta:

```text
src/
├── App.tsx                         # Enrutamiento principal y agrupación de rutas
├── main.tsx                        # Punto de entrada, proveedores globales
├── index.css                       # Tokens de diseño y utilidades Tailwind v4
├── components/
│   ├── common/                     # Utilidades reutilizables
│   │   ├── ScrollToTop.tsx         # Resetea scroll al cambiar ruta
│   │   └── PageMeta.tsx            # SEO meta; `AppWrapper` (HelmetProvider)
│   ├── form/                       # Campos de formulario y helpers
│   │   └── form-elements/          # Ejemplos de campos (DefaultInputs)
│   └── ui/                         # UI atómica (Modal, Button, Alert)
├── context/
│   ├── ThemeContext.tsx            # Tema claro/oscuro y variante `.dark`
│   └── SidebarContext.tsx          # Estado del sidebar, hover, móvil
├── layout/
│   ├── AppLayout.tsx               # Layout principal y contenedor de páginas
│   ├── AppHeader.tsx               # Encabezado (acciones, tema, perfil)
│   ├── AppSidebar.tsx              # Menú de navegación y submenús
│   └── Backdrop.tsx                # Fondo para sidebar móvil
├── pages/                          # Páginas agrupadas por dominio
│   ├── Dashboard/Home.tsx          # Inicio del panel
│   ├── AuthPages/SignIn.tsx        # Inicio de sesión
│   ├── AuthPages/SignUp.tsx        # Registro
│   ├── Calendar.tsx                # Calendario (FullCalendar)
│   ├── UserProfiles.tsx            # Perfil de usuario
│   ├── Forms/FormElements.tsx      # Componentes de formulario
│   ├── Tables/BasicTables.tsx      # Tablas básicas
│   ├── Charts/{LineChart,BarChart}.tsx
│   ├── Period/period.tsx           # Gestión de periodos (orquestación)
│   ├── Blank.tsx                   # Plantilla vacía
│   └── OtherPage/NotFound.tsx      # 404
├── features/                       # Feature-based modules
│   └── periods/
│       ├── components/
│       │   ├── PeriodTable.tsx
│       │   ├── PeriodModal.tsx
│       │   └── PeriodViewModal.tsx
│       ├── hooks/usePeriods.tsx    # Estado y efectos (CRUD, alertas)
│       ├── services/periodService.tsx # Cliente de API (MockAPI)
│       └── types/index.ts          # Tipos de Periodo/DTO
├── icons/                          # SVGs como componentes (via SVGR)
│   └── index.ts                    # Exportaciones centralizadas
└── vite.config.ts                  # Configuración de Vite y plugins
```

Entradas y puntos de extensión:

- `src/main.tsx`: inicia la app con `StrictMode`, `ThemeProvider` y `AppWrapper` (HelmetProvider). Importa estilos globales y de terceros.
- `src/App.tsx`: define el router (`BrowserRouter`, `Routes`, `Route`) y agrupa rutas por layout.
- `src/layout/AppLayout.tsx`: envuelve páginas con `SidebarProvider`, header y sidebar; expone `Outlet` para render de rutas anidadas.
- `src/context/*`: añade proveedores globales. Extiende añadiendo nuevos contextos con patrón Provider + Hook (`useX`).
- `src/index.css`: personaliza tokens de diseño con `@theme`, variantes (`@custom-variant dark`) y utilidades `@utility` propias.

## 2. Tecnologías y configuraciones

Herramientas y librerías principales (con versiones y configuración relevante):

- Framework y build
  - `react` `^19.0.0`, `react-dom` `^19.0.0`
  - `vite` `^6.1.0` con `@vitejs/plugin-react` `^4.3.4` y `vite-plugin-svgr` `^4.3.0`
  - `typescript` `~5.7.2` y `tsconfig.app.json` con `strict: true`, `jsx: react-jsx`, `moduleResolution: bundler`

- Estilos y UI
  - `tailwindcss` `^4.1.18` y `@tailwindcss/postcss` `^4.1.18` (configuración CSS-first en `index.css`, sin `tailwind.config.js`)
  - `tailwind-merge` `^3.0.1` para combinar clases de Tailwind de forma segura
  - Fuentes Google (`Outfit`) y utilidades definidas con `@utility`

- Routing y SEO
  - `react-router` `^7.1.5` (uso de `BrowserRouter`, `Routes`, `Route`)
  - `react-helmet-async` `^2.0.5` para metadatos por página, envuelto por `AppWrapper`

- Formularios, validación y componentes
  - `react-hook-form` `^7.69.0` y `zod` `^4.2.1` con `@hookform/resolvers` `^5.2.2`
  - `react-flatpickr` `^4.0.11` y `flatpickr` `^4.6.13` para selección de fechas (con estilos `.dark` en modales)
  - `@fullcalendar/*` `^6.1.15` para calendario interactivo
  - `apexcharts` `^4.1.0` y `react-apexcharts` `^1.7.0` para gráficos
  - `react-dnd` `^16.0.1` y `react-dnd-html5-backend` `^16.0.1` para drag-and-drop
  - `swiper` `^11.2.3` para deslizadores

- Íconos y assets
  - `vite-plugin-svgr` transforma SVGs en componentes React (`named export: ReactComponent`). Ver `src/icons/index.ts`.

- Calidad y linting
  - `eslint` `^9.19.0`, `@eslint/js` `^9.19.0`, `typescript-eslint` `^8.22.0`
  - Reglas: hooks de React y `react-refresh` (ver `eslint.config.js`)

Configuraciones especiales:

- `vite.config.ts`: habilita SVGR con `exportType: "named"` y `namedExport: "ReactComponent"`.
- `tsconfig.app.json`: `strict`, `noUnusedLocals`, `noUnusedParameters`, `moduleDetection: force` para robustez en compilación.
- `index.css`: tokens `@theme` para colores, tipografías y utilidades (`@utility menu-item`, etc.), además de `@custom-variant dark`.

## 3. Guía de comprensión del código

Arquitectura y patrones de diseño:

- Layout Wrapper Pattern: `AppLayout` comparte estructura común (sidebar, header, contenedor) y provee `SidebarProvider`.
- Route Grouping: rutas bajo `AppLayout` para páginas privadas/estructuradas y rutas públicas para autenticación.
- Context Provider Pattern: `ThemeContext` y `SidebarContext` exponen hooks (`useTheme`, `useSidebar`).
- Feature-based Modules: una feature encapsula componentes, hooks, servicios y tipos (`features/periods/*`).
- SEO per-page: `PageMeta` con `Helmet` para `<title>` y `<meta description>`.
- Utilities-first CSS: Tailwind v4 con `@theme`, `@utility` y variante `dark`. Sin `tailwind.config.js`.

Convenciones de código:

- TypeScript estricto, tipado explícito en props y hooks.
- Exportaciones centralizadas en `src/icons/index.ts` y en módulos de feature.
- Nombres descriptivos y coherentes (`PeriodModal`, `PeriodViewModal`, `usePeriods`).
- Separación clara UI vs lógica: formularios y modales consumen hooks/servicios.

Archivos de entrada y puntos de extensión:

- Entrada: `index.html` → `src/main.tsx` → `src/App.tsx`.
- Extensión de rutas: editar `src/App.tsx` y `src/layout/AppSidebar.tsx`.
- Extensión de SEO: usar `PageMeta` en cada página.
- Extensión de tema: usar `useTheme` y clases `dark` para estilos.
- Extensión de diseño: añadir utilidades en `index.css` con `@utility`.

## 4. Flujo de trabajo del sistema

- Inicio: `main.tsx` monta `<App />` dentro de `ThemeProvider` y `AppWrapper`.
- Enrutamiento: `App.tsx` define grupos de rutas:
  - Con `AppLayout`: `"/"`, `"/profile"`, `"/calendar"`, `"/form-elements"`, `"/basic-tables"`, `"/period"`, UI y Charts.
  - Públicas: `"/signin"`, `"/signup"`.
  - Fallback: `"*"` → `NotFound`.
- Navegación: `AppSidebar` controla submenús y estado activo (`useSidebar`).
- SEO: cada página establece título y descripción con `PageMeta`.
- Tema: `ThemeContext` persiste preferencia en `localStorage` y aplica `.dark` al `documentElement`.

## 5. Instrucciones para desarrollo

Agregar una nueva página/feature:

1) Crear módulo de feature

```bash
src/features/users/
├── components/UserTable.tsx
├── hooks/useUsers.tsx
├── services/userService.ts
└── types/index.ts
```

2) Crear página y ruta

```tsx
// src/pages/Users.tsx
import PageMeta from "../components/common/PageMeta";
import UserTable from "../features/users/components/UserTable";

export default function Users() {
  return (
    <>
      <PageMeta title="Usuarios" description="Gestión de usuarios" />
      <UserTable />
    </>
  );
}

// src/App.tsx (añadir ruta bajo AppLayout)
<Route path="/users" element={<Users />} />
```

3) Añadir item al sidebar

```tsx
// src/layout/AppSidebar.tsx
{ name: "Users", path: "/users", icon: <UserCircleIcon /> }
```

4) Servicios y validación

- Implementar `userService.ts` con llamadas a API (fetch/axios).
- Usar `react-hook-form` + `zod` para formularios y validación.

### Estándares de Modales y Validación

Para asegurar la consistencia visual y funcional en toda la aplicación, se han definido los siguientes estándares para los modales de creación y edición:

1. **Estructura Visual (Pixel-Perfect):**
   - Los modales deben utilizar el componente `Modal` con las clases `max-w-xl p-6`.
   - El encabezado debe incluir un título (`h5` con clases `mb-2 font-semibold text-gray-800 dark:text-white/90`) y una descripción corta (`p` con clases `text-sm text-gray-500 dark:text-gray-400`).
   - Los campos del formulario se agrupan en un contenedor con borde redondeado (`rounded-2xl border border-gray-200 dark:border-gray-800`).
   - Las etiquetas (`label`) deben tener el espaciado `mb-2.5` y ser `font-medium`.

2. **Sistema de Validación Contextual:**
   - Se utiliza `react-hook-form` junto con `zod` para la lógica de validación.
   - **Mensajes de error:** No se muestran mensajes genéricos como "Este campo es obligatorio" de forma persistente. En su lugar, se muestran mensajes contextuales solo después de que el usuario haya intentado enviar el formulario o haya interactuado con el campo.
   - **Feedback visual:** Los inputs cambian su estado visual (borde rojo) solo cuando hay un error activo.

3. **Botones de Acción:**
   - Los botones de acción se ubican en la parte inferior derecha con un `gap-4.5`.
   - El botón de "Cancelar" debe tener un estilo `outline` consistente.
   - El botón de acción principal ("Guardar", "Actualizar") utiliza el color `brand-500` y muestra un estado deshabilitado durante la carga.

Configuración del entorno de desarrollo:

- Requisitos: `Node.js >= 18`, `npm` o `yarn`.
- Instalación: `npm install`.
- Desarrollo: `npm run dev` y navegar a `http://localhost:5173`.
- Lint: `npm run lint`.
- Build: `npm run build` y `npm run preview` para validar la salida en `dist/`.

Pruebas y validación de cambios:

- Validación manual de UI: revisar páginas añadidas y navegación desde el sidebar.
- SEO: confirmar `<title>` y `<meta>` por página con `PageMeta`.
- Tema: probar alternancia claro/oscuro; asegurar estilos `.dark` en componentes (p. ej. Flatpickr dentro de modales).
- Rendimiento: considerar `React.lazy` para carga diferida en páginas pesadas.

## 6. Scripts y requisitos

- `npm run dev`: servidor de desarrollo con HMR.
- `npm run build`: compilación de producción (TypeScript + Vite).
- `npm run preview`: previsualización local de la build.
- `npm run lint`: análisis estático con ESLint.

Requisitos del sistema:

- Node.js `>= 18`
- Navegador moderno (Chrome, Edge, Firefox). En móvil, revisar breakpoints (`--breakpoint-*`).

## 7. Personalización de UI (Tailwind v4)

Tailwind v4 usa configuración **CSS-first**. No se emplea `tailwind.config.js`; la personalización se hace en `src/index.css`.

Tokens y utilidades:

```css
/* Variantes */
@custom-variant dark (&:is(.dark *));

/* Tokens de tema */
@theme {
  --font-outfit: Outfit, sans-serif;
  --color-brand-500: #465fff;
  /* ... más colores y sombras ... */
}

/* Utilidades personalizadas */
@utility menu-item {
  @apply relative flex items-center gap-3 px-3 py-2 rounded-lg;
}
```

Buenas prácticas:

- Centralizar nuevos tokens en `@theme` (colores, sombras, tipografía).
- Añadir utilidades con `@utility` para patrones recurrentes (ej., menú lateral).
- Asegurar compatibilidad con `.dark` en componentes de terceros (ver estilos de Flatpickr en modales).

## 8. Licencia

Este proyecto se distribuye bajo la licencia MIT.
