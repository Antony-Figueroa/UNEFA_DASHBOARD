import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Transition, TargetAndTransition, VariantLabels } from "framer-motion";

interface RotatingTextProps {
  texts: string[];
  mainClassName?: string;
  staggerFrom?: "first" | "last" | "center" | number;
  initial?: TargetAndTransition | VariantLabels | boolean;
  animate?: TargetAndTransition | VariantLabels;
  exit?: TargetAndTransition | VariantLabels;
  staggerDuration?: number;
  splitLevelClassName?: string;
  transition?: Transition;
  rotationInterval?: number;
  element?: React.ElementType;
  className?: string;
}

const RotatingText: React.FC<RotatingTextProps> = ({
  texts,
  mainClassName = "",
  staggerFrom = "last",
  initial = { y: "100%" },
  animate = { y: "0%" },
  exit = { y: "-120%" },
  staggerDuration = 0.025,
  splitLevelClassName = "",
  transition = { type: "spring", damping: 30, stiffness: 400 },
  rotationInterval = 2000,
  element: Element = "span",
  className = "",
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [texts.length, rotationInterval]);

  const getStaggerDelay = useCallback(
    (charIndex: number, totalChars: number) => {
      if (typeof staggerFrom === "number") {
        return Math.abs(charIndex - staggerFrom) * staggerDuration;
      }
      if (staggerFrom === "first") {
        return charIndex * staggerDuration;
      }
      if (staggerFrom === "last") {
        return (totalChars - 1 - charIndex) * staggerDuration;
      }
      if (staggerFrom === "center") {
        const center = (totalChars - 1) / 2;
        return Math.abs(charIndex - center) * staggerDuration;
      }
      return 0;
    },
    [staggerFrom, staggerDuration]
  );

  return (
    <Element
      className={`relative inline-flex flex-wrap whitespace-pre-wrap ${mainClassName} ${className}`}
      aria-live="polite"
    >
      <span className="sr-only">{texts[index]}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          className={`flex flex-wrap ${splitLevelClassName}`}
          aria-hidden="true"
        >
          {texts[index].split("").map((char, i) => (
            <motion.span
              key={i}
              initial={initial}
              animate={animate}
              exit={exit}
              transition={{
                ...transition,
                delay: getStaggerDelay(i, texts[index].length),
              }}
              className="inline-block"
              style={{ whiteSpace: char === " " ? "pre" : "normal" }}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </Element>
  );
};

export default RotatingText;
