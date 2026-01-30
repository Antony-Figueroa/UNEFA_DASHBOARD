import { cn } from "../../../utils/cn";

/**
 * Props for the ResponsiveImage component.
 */
interface ResponsiveImageProps {
  /** Image source URL. */
  src: string;
  /** Image alt text for accessibility. */
  alt: string;
  /** Additional CSS classes for the container. */
  className?: string;
  /** Additional CSS classes for the img element. */
  imgClassName?: string;
  /** Aspect ratio of the image (e.g., "aspect-video", "aspect-square"). */
  aspectRatio?: string;
}

/**
 * A responsive image component that handles theme borders and overflow.
 * 
 * @example
 * ```tsx
 * <ResponsiveImage 
 *   src="/images/cover.png" 
 *   alt="Dashboard Cover" 
 *   aspectRatio="aspect-video" 
 * />
 * ```
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className = "",
  imgClassName = "",
  aspectRatio = "",
}) => {
  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover border border-border-light dark:border-border-dark",
          aspectRatio,
          imgClassName
        )}
      />
    </div>
  );
};

export default ResponsiveImage;
