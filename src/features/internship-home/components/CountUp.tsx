import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface CountUpProps {
  from?: number;
  to?: number;
  end?: number;
  separator?: string;
  direction?: "up" | "down";
  duration?: number;
  className?: string;
  suffix?: string;
}

export default function CountUp({
  from = 0,
  to,
  end,
  separator = ",",
  direction = "up",
  duration = 1,
  className = "",
  suffix = "",
}: CountUpProps) {
  const finalTo = end ?? to ?? 0;
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? finalTo : from);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
    duration: duration * 1000,
  });
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(direction === "down" ? from : finalTo);
    }
  }, [isInView, motionValue, from, finalTo, direction]);

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        const formattedValue = Intl.NumberFormat("en-US").format(Math.round(latest));
        const displayValue = separator === "," ? formattedValue : formattedValue.replace(/,/g, separator);
        ref.current.textContent = displayValue + suffix;
      }
    });
  }, [springValue, separator, suffix]);

  return <span ref={ref} className={className} />;
}
