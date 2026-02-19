import { createContext, useContext } from "react";
import { BrandColorKey } from "../theme/brandColors";

export type Theme = "light" | "dark";

export type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  colorMode: Theme;
  brandColor: BrandColorKey;
  setBrandColor: (color: BrandColorKey) => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
