import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/cn';

/**
 * Props for the Tooltip component.
 */
interface TooltipProps {
  /** The content to show inside the tooltip. */
  content: React.ReactNode;
  /** The element that triggers the tooltip. */
  children: React.ReactElement<{ 
    style?: React.CSSProperties;
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
    onFocus?: React.FocusEventHandler;
    onBlur?: React.FocusEventHandler;
    'aria-describedby'?: string;
  }>;
  /** Additional CSS classes for the tooltip container. */
  className?: string;
  /** Delay in ms before appearing. Defaults to 0. */
  delay?: number;
  /** Duration in ms to stay visible before automatically hiding. */
  duration?: number;
  /** Whether the tooltip is disabled. */
  isDisabled?: boolean;
}

/**
 * A accessible tooltip component that appears on hover or focus.
 * Uses React Portal for positioning to avoid clipping.
 * 
 * @example
 * ```tsx
 * <Tooltip content="Eliminar registro">
 *   <button onClick={handleDelete}><TrashIcon /></button>
 * </Tooltip>
 * ```
 */
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
  const tooltipId = React.useId();

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current || !isVisible || !content) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const offset = 8;
    const threshold = 16;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top: number;
    let left: number;

    // Vertical positioning
    if (spaceAbove > tooltipHeight + offset) {
      top = rect.top + window.scrollY - tooltipHeight - offset;
    } else if (spaceBelow > tooltipHeight + offset) {
      top = rect.bottom + window.scrollY + offset;
    } else {
      top = Math.max(window.scrollY + threshold, rect.top + window.scrollY - tooltipHeight - offset);
    }

    // Horizontal positioning (Centered)
    left = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;

    // Adjust for side overflows
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
  }, [isVisible, content]);

  useLayoutEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      updatePosition();
      animationFrameId = requestAnimationFrame(tick);
    };

    if (isVisible && content) {
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
  }, [isVisible, content, updatePosition]);

  const showTooltip = () => {
    if (isDisabled || !content) return;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      
      if (duration) {
        if (durationTimeoutRef.current) clearTimeout(durationTimeoutRef.current);
        durationTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, duration);
      }
    }, delay);
  };

  const hideTooltip = () => {
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

  // Clone child to attach event handlers and aria attributes
  const trigger = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      showTooltip();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      hideTooltip();
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      showTooltip();
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      hideTooltip();
    },
    'aria-describedby': isVisible ? tooltipId : undefined,
  });

  return (
    <>
      <div ref={triggerRef} className="inline-block">
        {trigger}
      </div>
      {isVisible && content && createPortal(
        <div
          id={tooltipId}
          ref={tooltipRef}
          role="tooltip"
          style={style}
          className={cn(
            "pointer-events-none px-2 py-1 text-xs font-medium text-white bg-gray-900/90 dark:bg-gray-700/95 backdrop-blur-sm rounded shadow-lg max-w-xs wrap-break-word",
            className
          )}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};
