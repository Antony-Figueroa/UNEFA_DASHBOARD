/**
 * Design System Constants
 * 
 * This file contains the unified color palette and mappings for the application.
 * Mapeo de colores por categoría:
 * - ESTUDIANTE: Azul (#3498db). Utilizado para alertas, notificaciones y estados
 *   relacionados con los estudiantes para mantener consistencia visual.
 */

export const CATEGORY_COLORS = {
  ESTUDIANTE: {
    hex: "#3498db",
    tailwind: "blue-500",
    bg: "bg-[#ebf5ff]", // Solid light blue
    border: "border-[#3498db]",
    text: "text-[#3498db]",
    darkBg: "dark:bg-[#1e3a5f]", // Solid dark blue
    darkBorder: "dark:border-[#2b5a91]",
    darkText: "dark:text-[#7dd3fc]",
  },
  // Add other categories here as needed
} as const;

export type Category = keyof typeof CATEGORY_COLORS;

export const CATEGORY_LABELS: Record<Category, string> = {
  ESTUDIANTE: "Estudiante",
};
