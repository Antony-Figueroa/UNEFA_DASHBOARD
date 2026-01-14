import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface CountUpProps {
  from?: number;
  to: number;
  separator?: string;
  direction?: "up" | "down";
  duration?: number;
  className?: string;
}

export default function CountUp({
  from = 0,
  to,
  separator = ",",
  direction = "up",
  duration = 1,
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? to : from);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
    duration: duration * 1000,
  });
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(direction === "down" ? from : to);
    }
  }, [isInView, motionValue, from, to, direction]);

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        const formattedValue = Intl.NumberFormat("en-US").format(Math.round(latest));
        ref.current.textContent = separator === "," ? formattedValue : formattedValue.replace(/,/g, separator);
      }
    });
  }, [springValue, separator]);

  return <span ref={ref} className={className} />;
}
