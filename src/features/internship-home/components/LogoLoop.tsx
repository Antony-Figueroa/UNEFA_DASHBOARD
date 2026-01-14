import React from "react";
import { motion } from "framer-motion";

interface Logo {
  node?: React.ReactNode;
  src?: string;
  alt?: string;
  title: string;
  href: string;
}

interface LogoLoopProps {
  logos: Logo[];
  speed?: number;
  direction?: "left" | "right" | "up" | "down";
  logoHeight?: number;
  gap?: number;
  hoverSpeed?: number;
  scaleOnHover?: boolean;
  fadeOut?: boolean;
  fadeOutColor?: string;
  ariaLabel?: string;
}

const LogoLoop: React.FC<LogoLoopProps> = ({
  logos,
  speed = 40,
  direction = "left",
  logoHeight = 40,
  gap = 40,
  scaleOnHover = false,
  fadeOut = false,
  fadeOutColor = "white",
  ariaLabel = "Logos",
}) => {
  const isVertical = direction === "up" || direction === "down";

  const loopTransition = {
    duration: speed,
    repeat: Infinity,
    repeatType: "loop",
    ease: "linear",
  } as const;

  const initialPos = direction === "left" || direction === "up" ? 0 : "-50%";
  const animatePos = direction === "left" || direction === "up" ? "-50%" : 0;

  return (
    <div
      className="relative overflow-hidden w-full flex items-center py-12"
      aria-label={ariaLabel}
    >
      {fadeOut && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to right, ${fadeOutColor}, transparent)`,
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to left, ${fadeOutColor}, transparent)`,
            }}
          />
        </>
      )}

      <motion.div
        className={`flex ${isVertical ? "flex-col" : "flex-row"} items-center`}
        style={{ gap: `${gap}px` }}
        animate={{
          [isVertical ? "y" : "x"]: [initialPos, animatePos],
        }}
        transition={loopTransition}
      >
        {[...logos, ...logos, ...logos, ...logos].map((logo, index) => (
          <div key={`${logo.title}-${index}`} className="relative group shrink-0">
            <a
              href={logo.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center transition-transform duration-300"
              style={{ height: `${logoHeight}px` }}
            >
              <motion.div
                whileHover={scaleOnHover ? { scale: 1.1 } : {}}
                className="text-text-secondary hover:text-brand-500 transition-colors"
                style={{ fontSize: `${logoHeight}px` }}
              >
                {logo.node ? (
                  logo.node
                ) : (
                  <img
                    src={logo.src}
                    alt={logo.alt || logo.title}
                    style={{ height: "100%", width: "auto" }}
                  />
                )}
              </motion.div>
            </a>
            
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#2d90c4] text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-theme-md">
              {logo.title}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2d90c4] rotate-45" />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default LogoLoop;
