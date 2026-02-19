# UNEFA Dashboard - Arquitectura Técnica y Guía de Mantenimiento

Este documento detalla la arquitectura implementada en el proyecto **UNEFA_DASHBOARD**, basada en **Clean Architecture** y **Feature-Based Architecture**, con el objetivo de proporcionar un sistema escalable, mantenible y robusto.

---

## 🏗️ Arquitectura del Sistema

El proyecto ha sido refactorizado para separar claramente las responsabilidades, siguiendo los principios **SOLID**, **DRY** y **KISS**.

### 1. Organización por Características (Feature-Based)
En lugar de agrupar por tipo de archivo (hooks, components, services), el código se organiza por módulos funcionales dentro de `src/features/`. Cada característica es autónoma y contiene:
- `components/`: Componentes específicos de la funcionalidad.
- `hooks/`: Lógica de estado y efectos (incluyendo integración con CRUD).
- `services/`: Capa de acceso a datos (API).
- `types/`: Definiciones de interfaces y tipos.
- `utils/`: Utilidades específicas del módulo.

### 2. Capas de la Aplicación (Clean Architecture)
- **Capa de Presentación (UI):** Componentes React que utilizan hooks para obtener datos y manejar acciones.
- **Capa de Lógica de Negocio (Hooks):** Orquestan el estado, validaciones y llamadas a servicios.
- **Capa de Datos (Services):** Encapsula las peticiones HTTP y la comunicación con Supabase/Backend.

---

## 🛠️ Tecnologías Principales

- **Frontend:** React 19, Vite.
- **Estilos:** Tailwind CSS v4, Framer Motion (animaciones).
- **Formularios:** React Hook Form + Zod (validación).
- **Iconos:** Lucide React.
- **Utilidades:** `clsx` y `tailwind-merge` (vía `cn.ts`).

---

## 🧩 Patrones y Estándares de Código

### Documentación TSDoc
Todos los componentes, funciones y tipos deben estar documentados utilizando **TSDoc** en español. Esto incluye:
- Propósito del elemento.
- Descripción de parámetros y valores de retorno.
- Ejemplos de uso (`@example`).

### Componentes de UI Centralizados
Los componentes en `src/components/ui/` son la base visual del proyecto. Deben ser:
- **Atómicos:** Realizar una sola tarea visual.
- **Accesibles:** Incluir atributos `aria-*` y roles adecuados.
- **Personalizables:** Aceptar `className` y utilizar la utilidad `cn()` para fusionar estilos.

### Gestión de CRUD Centralizada
Se utiliza un patrón de fábrica para servicios CRUD:
- `crudServiceFactory.ts`: Genera servicios estandarizados.
- `useCrud.ts`: Hook genérico para manejar el estado de operaciones CRUD (loading, error, data).

---

## 📝 Guía de Mantenimiento

### Añadir una Nueva Característica
1. Crea una carpeta en `src/features/nombre-feature`.
2. Define los tipos en `types.ts`.
3. Crea el servicio usando `createCrudService`.
4. Implementa el hook `useNombreFeature` utilizando `useCrudResource`.
5. Desarrolla los componentes necesarios en la subcarpeta `components/`.

### Estándares de Naming
- **Componentes:** `PascalCase` (ej. `Button.tsx`).
- **Hooks:** `camelCase` con prefijo `use` (ej. `useAuth.ts`).
- **Servicios:** `camelCase` con sufijo `Service` (ej. `usersService.ts`).
- **Tipos/Interfaces:** `PascalCase` (ej. `UserPayload`).

### Manejo de Errores
Utiliza logs con prefijo de contexto para facilitar la depuración:
```typescript
console.error("[FeatureName:ActionName]", error);
```

---

## 🚀 Mejores Prácticas Implementadas
- **Mobile First:** Diseño responsivo desde el inicio.
- **Tree Shaking:** Importaciones optimizadas.
- **Accesibilidad (A11y):** Uso de HTML semántico y atributos ARIA.
- **Performance:** Minimización de re-renders mediante el uso estratégico de hooks.

---

## 📋 Sistema de Evaluaciones de Prácticas

El sistema incluye un módulo completo para la gestión de evaluaciones de prácticas profesionales.

### Tipos de Evaluación

| Tipo | Ponderación | Criterios | Descripción |
|------|-------------|-----------|-------------|
| **Institucional** | 40% | 20 ítems | Evaluación del tutor de la institución |
| **Académico** | 30% | 20 ítems | Evaluación del tutor académico de la universidad |
| **Comité** | 30% | 15 ítems | Evaluación del comité durante la defensa oral |

### Estructura de Tablas

```sql
t_evaluation_criteria  -- Catálogo de 55 criterios predefinidos
t_evaluation           -- Evaluaciones principales
t_evaluation_detail    -- Detalles de cada ítem evaluado
```

### Escala de Calificación

- **Rango**: 0 a 20 puntos por criterio
- **Nota Final**: Promedio ponderado de las 3 evaluaciones
- **Cálculo**: (Institucional × 0.40) + (Académico × 0.30) + (Comité × 0.30)

### Endpoints del Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/evaluations/criteria` | Obtener criterios por tipo |
| GET | `/api/evaluations` | Listar evaluaciones |
| GET | `/api/evaluations/:id` | Obtener evaluación con detalles |
| POST | `/api/evaluations` | Crear nueva evaluación |
| PUT | `/api/evaluations/:id` | Actualizar evaluación |
| DELETE | `/api/evaluations/:id` | Eliminar evaluación (soft delete) |
| GET | `/api/evaluations/practice/:id/status` | Estado de evaluación por práctica |

---
