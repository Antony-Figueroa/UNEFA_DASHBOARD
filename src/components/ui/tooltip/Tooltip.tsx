import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<{ style?: React.CSSProperties }>;
  className?: string;
  delay?: number; // Delay in ms before appearing
  duration?: number; // Duration in ms to stay visible
  isDisabled?: boolean; // If the trigger is disabled
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  className = "",
  delay = 0,
  duration,
  isDisabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    visibility: 'hidden',
    zIndex: 1000001,
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 0.15s ease-in-out',
  });
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current || !isVisible) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const offset = 5;
    const threshold = 20;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top: number;
    let left: number;

    // Posicionamiento Vertical
    if (spaceAbove > tooltipHeight + offset) {
      // Por defecto arriba para tooltips si hay espacio
      top = rect.top + window.scrollY - tooltipHeight - offset;
    } else if (spaceBelow > tooltipHeight + offset) {
      // Abajo si no hay espacio arriba
      top = rect.bottom + window.scrollY + offset;
    } else {
      // Ajuste forzado al viewport
      top = Math.max(window.scrollY + threshold, rect.top + window.scrollY - tooltipHeight - offset);
    }

    // Posicionamiento Horizontal (Centrado)
    left = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;

    // Ajustar si se sale por los lados
    if (left < window.scrollX + threshold) {
      left = window.scrollX + threshold;
    } else if (left + tooltipWidth > window.scrollX + window.innerWidth - threshold) {
      left = window.scrollX + window.innerWidth - tooltipWidth - threshold;
    }

    setStyle({
      position: 'absolute',
      top,
      left,
      zIndex: 1000001,
      visibility: 'visible',
      pointerEvents: 'none',
      opacity: 1,
    });
  }, [isVisible]);

  useLayoutEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      updatePosition();
      animationFrameId = requestAnimationFrame(tick);
    };

    if (isVisible) {
      updatePosition();
      animationFrameId = requestAnimationFrame(tick);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, updatePosition]);

  const handleMouseEnter = () => {
    // Clear any pending timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (durationTimeoutRef.current) clearTimeout(durationTimeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      
      // If duration is set, auto-hide after that time
      if (duration) {
        durationTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, duration);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (durationTimeoutRef.current) clearTimeout(durationTimeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (durationTimeoutRef.current) clearTimeout(durationTimeoutRef.current);
    };
  }, []);

  return (
    <div 
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block ${isDisabled ? "cursor-not-allowed" : ""} ${className}`}
    >
      {React.cloneElement(children, {
        style: {
          ...(children.props.style || {}),
          pointerEvents: isDisabled ? 'none' : (children.props.style?.pointerEvents || 'auto')
        }
      })}
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          style={style}
          className="pointer-events-none fixed"
        >
          <div className={`rounded-lg bg-bg-dark px-3 py-2 text-xs text-white shadow-2xl animate-fadeIn border border-white/10 max-w-xs ${className}`}>
            {content}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
