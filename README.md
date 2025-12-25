# TailAdmin - React Admin Dashboard Template

TailAdmin es una plantilla de panel de administración (Admin Dashboard) moderna, gratuita y de código abierto, construida con **React** y **Tailwind CSS**. Proporciona una base sólida y escalable para crear back-ends, paneles de control SaaS y aplicaciones web ricas en datos.

## 🚀 Características Principales

- **Stack Moderno**: Construido con React, Tailwind CSS y Vite para un rendimiento ultrarrápido.
- **Diseño Responsivo**: Interfaz totalmente adaptativa que funciona en móviles, tabletas y escritorio.
- **Componentes UI**: Incluye una amplia variedad de componentes preconstruidos (formularios, tablas, botones, alertas).
- **Gráficos Interactivos**: Integración con ApexCharts para visualización de datos dinámica.
- **Modo Oscuro/Claro**: Soporte nativo para cambio de tema (Dark Mode) incluido.
- **Enrutamiento**: Configurado con React Router DOM.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu entorno de desarrollo:

- [Node.js](https://nodejs.org/) (Versión 16.x o superior recomendada)
- npm (incluido con Node) o yarn

## 🛠️ Instalación y Configuración

Sigue estos pasos para levantar el proyecto en tu máquina local:

1.  **Clonar el repositorio:**

    ```bash
    git clone https://github.com/TailAdmin/free-react-tailwind-admin-dashboard.git
    cd free-react-tailwind-admin-dashboard
    ```

    _(Nota: Si estás creando el proyecto desde cero, omite el clonado y asegúrate de estar en la carpeta raíz)._

2.  **Instalar dependencias:**

    ```bash
    npm install
    # O si prefieres yarn:
    # yarn install
    ```

3.  **Ejecutar el servidor de desarrollo:**

    ```bash
    npm run dev
    ```

    Abre tu navegador y visita `http://localhost:5173` (el puerto puede variar según la disponibilidad).

## 📦 Scripts Disponibles

En el directorio del proyecto, puedes ejecutar los siguientes comandos:

- `npm run dev`: Inicia la aplicación en modo de desarrollo con recarga en caliente (HMR).
- `npm run build`: Compila la aplicación para producción en la carpeta `dist`.
- `npm run preview`: Previsualiza la versión de producción localmente.
- `npm run lint`: Ejecuta ESLint para encontrar y arreglar problemas en el código.

## 📂 Estructura del Proyecto

Una visión general de la organización de carpetas sugerida para este proyecto:

```text
src/
├── components/       # Componentes reutilizables (Botones, Inputs, Modales, Cards)
├── images/           # Activos estáticos (Logos, Iconos, Vectores)
├── layout/           # Layouts principales (DefaultLayout, Sidebar, Header)
├── pages/            # Vistas/Páginas de la aplicación (Dashboard, Profile, Settings)
├── hooks/            # Custom Hooks de React (useLocalStorage, useColorMode)
├── App.tsx           # Configuración de rutas y punto de entrada de la lógica
└── main.tsx          # Renderizado del DOM y estilos globales
```

## 🎨 Personalización

### Configuración de Tailwind

Puedes personalizar los colores, fuentes, espaciados y otros estilos editando el archivo `tailwind.config.js` ubicado en la raíz del proyecto.

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT.
