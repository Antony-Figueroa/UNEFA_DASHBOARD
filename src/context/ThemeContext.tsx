"use client";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { ThemeContext, type Theme } from "./theme";
import { BrandColorKey, applyBrandColor, isValidBrandColor } from "../theme/brandColors";
import apiClient from "../api/apiClient";

const DEFAULT_BRAND_COLOR: BrandColorKey = "blue";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [brandColor, setBrandColorState] = useState<BrandColorKey>(DEFAULT_BRAND_COLOR);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedBrandColor = localStorage.getItem("brandColor");
    
    const initialTheme = savedTheme || "light";
    const initialBrandColor = savedBrandColor && isValidBrandColor(savedBrandColor) 
      ? savedBrandColor 
      : DEFAULT_BRAND_COLOR;

    setTheme(initialTheme);
    setBrandColorState(initialBrandColor);
    applyBrandColor(initialBrandColor);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("brandColor", brandColor);
      applyBrandColor(brandColor);
    }
  }, [brandColor, isInitialized]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const setBrandColor = useCallback((color: BrandColorKey) => {
    setBrandColorState(color);
    
    apiClient.put("/api/user/theme", { brandColor: color }).catch((err) => {
      console.warn("[Theme] Could not sync brand color to server:", err.message);
    });
  }, []);

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        toggleTheme, 
        colorMode: theme, 
        brandColor, 
        setBrandColor 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
