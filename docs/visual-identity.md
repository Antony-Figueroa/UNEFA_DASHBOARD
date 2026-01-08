# Guía de Estilo: Sistema de Diálogos y Alertas

Este documento define el estándar visual y de comportamiento para todos los diálogos y alertas en la aplicación TailAdmin. La consistencia es clave para una experiencia de usuario intuitiva y profesional.

## 1. Paleta de Colores por Variante

Cada tipo de alerta utiliza una combinación específica de colores para fondo, bordes, iconos y botones:

| Variante | Uso | Color Principal (Brand/Base) | Clase Tailwind |
| :--- | :--- | :--- | :--- |
| **Success** | Operaciones exitosas | Green-500 | `success-500` |
| **Error** | Fallos críticos, errores | Red-500 | `error-500` |
| **Warning** | Advertencias, precauciones | Orange-500 | `warning-500` |
| **Info** | Información general | Blue-500 | `blue-light-500` |
| **Confirm** | Acciones que requieren confirmación | Brand-500 | `brand-500` |

## 2. Textos Estándar para Operaciones Comunes

Para mantener la coherencia en la comunicación, se deben utilizar los siguientes textos base:

### Eliminación de Registros
- **Título**: `¿Está seguro de eliminar este registro?`
- **Mensaje**: `Esta acción no se puede deshacer y el registro será marcado como inactivo.`
- **Botón Confirmar**: `Eliminar` (Variante Error/Warning)

### Restauración de Registros
- **Título**: `¿Desea restaurar este registro?`
- **Mensaje**: `El registro volverá a estar activo en el sistema.`
- **Botón Confirmar**: `Restaurar` (Variante Success/Confirm)

### Guardado Exitoso
- **Título**: `Registro guardado`
- **Mensaje**: `La información se ha procesado correctamente.`

## 3. Diseño de Componentes

### Estructura del Diálogo
- **Bordes**: Redondeado máximo (`rounded-[32px]`).
- **Sombra**: Sombra profunda (`shadow-2xl`).
- **Iconografía**: Iconos grandes (16x16 sm) centrados en la parte superior dentro de un círculo con fondo suave de la variante.
- **Tipografía**:
  - Título: `text-lg` a `text-xl`, `font-bold`.
  - Mensaje: `text-sm` a `text-base`, `text-gray-500`.

### Disposición de Elementos
1. **Icono**: Superior central.
2. **Título**: Inmediatamente debajo del icono.
3. **Cuerpo**: Texto centrado.
4. **Acciones**: Botones centrados en la parte inferior con un gap de `4.5` (18px).

## 4. Comportamiento y Animaciones

- **Transición**: Fade-in suave con escala desde el centro.
- **Interacción**: 
  - El botón de cancelación siempre debe estar a la izquierda del botón de acción principal.
  - El botón principal debe mostrar un estado de carga (`loading`) durante procesos asíncronos.
  - Cierre con tecla `ESC` o clic fuera del modal (si no es crítico).

## 5. Implementación Centralizada

Todos los diálogos deben utilizar el componente `UnifiedDialog` y la configuración definida en `DialogConfig.ts`.

```tsx
import UnifiedDialog from "@/components/ui/dialog/UnifiedDialog";
import { STANDARD_TEXTS } from "@/components/ui/dialog/DialogConfig";

// Ejemplo de uso
<UnifiedDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  variant="warning"
  {...STANDARD_TEXTS.CONFIRM_DELETE}
  onConfirm={handleDelete}
/>
```
