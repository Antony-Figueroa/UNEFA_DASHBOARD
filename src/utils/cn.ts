import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind classes safely using clsx and tailwind-merge.
 * 
 * @param inputs - Array of classes, objects, or arrays of classes.
 * @returns A string of merged Tailwind classes.
 * 
 * @example
 * cn("px-2 py-1", isPrimary && "bg-blue-500", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
