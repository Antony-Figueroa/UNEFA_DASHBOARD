import { useEffect, useRef, useContext, useState } from "react";
import { SidebarContext } from "../../context/sidebar";

const TopBanner = () => {
  const sidebarContext = useContext(SidebarContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const isExpanded = sidebarContext?.isExpanded ?? false;
  const isMobileOpen = sidebarContext?.isMobileOpen ?? false;

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    if (!isLargeScreen) {
      document.documentElement.style.setProperty("--banner-height", "0px");
      return;
    }

    const updateBannerHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight;
        document.documentElement.style.setProperty("--banner-height", `${height}px`);
      }
    };

    updateBannerHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateBannerHeight();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isLargeScreen, isExpanded, isMobileOpen]);

  if (!isLargeScreen) return null;

  if (!sidebarContext) {
    return (
      <div
        ref={containerRef}
        className="bg-white dark:bg-bg-dark border-b border-border-light dark:border-border-dark overflow-hidden"
      >
        <img
          src="/unefa-img/menbrete-nuevo.jpg"
          alt="Gobierno Bolivariano de Venezuela"
          className="w-full h-auto block"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed top-0 right-0 bg-white dark:bg-bg-dark border-b border-border-light dark:border-white/10 overflow-hidden transition-all duration-300"
      style={{ 
        left: isExpanded || isMobileOpen ? 280 : 72,
        zIndex: 30 
      }}
    >
      <img
        src="/unefa-img/menbrete-nuevo.jpg"
        alt="Gobierno Bolivariano de Venezuela"
        className="w-full h-auto block"
      />
    </div>
  );
};

export default TopBanner;
