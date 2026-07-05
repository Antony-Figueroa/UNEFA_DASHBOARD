/**
 * @file DisplayText.tsx
 * @description Componente para mostrar texto normalizado en pantalla.
 * 
 * La DB guarda en UPPERCASE (práctica correcta). Este componente convierte
 * a Title Case automáticamente al renderizar, sin tocar el dato original.
 * 
 * Si el texto ya está en Title Case o mixto (viene de otro lado), no lo toca.
 * 
 * @example
 * ```tsx
 * // DB guarda "JUAN PÉREZ", muestra "Juan Pérez"
 * <DisplayText>{usuario.nombre}</DisplayText>
 * 
 * // Ya está en Title Case, lo deja igual
 * <DisplayText>{"Juan Pérez"}</DisplayText> → "Juan Pérez"
 * ```
 */

import { toTitleCase } from "../../utils/textFormat";

interface DisplayTextProps {
  children: string | null | undefined;
  className?: string;
}

function isUppercase(text: string): boolean {
  return text === text.toUpperCase() && text !== text.toLowerCase();
}

export default function DisplayText({ children, className }: DisplayTextProps) {
  if (!children) return null;

  const text = children.trim();
  if (!text) return null;

  // Solo transformar si el texto está en UPPERCASE (viene de DB)
  // Si ya está en Title Case o tiene minúsculas, dejarlo como está
  const display = isUppercase(text) ? toTitleCase(text) : text;

  return <span className={className}>{display}</span>;
}
