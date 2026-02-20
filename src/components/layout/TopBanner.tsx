import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { SidebarContext } from "../../context/sidebar";

const TopBanner: React.FC = () => {
  const sidebarContext = useContext(SidebarContext);
  
  const isExpanded = sidebarContext?.isExpanded ?? false;
  
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateBannerHeight = useCallback(() => {
    if (containerRef.current && isLargeScreen) {
      const height = containerRef.current.offsetHeight;
      document.documentElement.style.setProperty("--banner-height", `${height}px`);
    } else {
      document.documentElement.style.setProperty("--banner-height", "0px");
    }
  }, [isLargeScreen]);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
      updateBannerHeight();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateBannerHeight]);

  useEffect(() => {
    updateBannerHeight();
  }, [updateBannerHeight]);

  if (!isLargeScreen) return null;

  return (
    <div 
      ref={containerRef}
      className={`fixed top-0 right-0 bg-white dark:bg-bg-dark border-b border-border-light dark:border-border-dark overflow-hidden z-40 transition-all duration-300 ease-in-out ${!sidebarContext ? "left-0" : isExpanded ? "left-72" : "left-[72px]"}`}
    >
      <img
        src="/unefa-img/menbrete-nuevo.jpg"
        alt="Gobierno Bolivariano de Venezuela"
        className="w-full h-auto block"
        onLoad={updateBannerHeight}
      />
    </div>
  );
};

export default TopBanner;
