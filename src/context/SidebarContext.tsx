import { useState, useEffect, useCallback } from "react";
import { SidebarContext } from "./sidebar";

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = useCallback(() => setIsExpanded(prev => !prev), []);
  const toggleMobileSidebar = useCallback(() => setIsMobileOpen(prev => !prev), []);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobileOpen,
        isHovered,
        toggleSidebar,
        toggleMobileSidebar,
        setIsMobileOpen,
        setIsHovered,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
