import { cn } from "../../../utils/cn";
import ResponsiveImage from "./ResponsiveImage";

/**
 * Props for the TwoColumnImageGrid component.
 */
interface TwoColumnImageGridProps {
  /** Array of images to display in the grid. */
  images: {
    src: string;
    alt: string;
  }[];
  /** Additional CSS classes for the grid container. */
  className?: string;
}

/**
 * A responsive two-column grid for images.
 * Automatically switches to one column on smaller screens.
 * 
 * @example
 * ```tsx
 * <TwoColumnImageGrid 
 *   images={[
 *     { src: "/img1.png", alt: "Image 1" },
 *     { src: "/img2.png", alt: "Image 2" }
 *   ]} 
 * />
 * ```
 */
export const TwoColumnImageGrid: React.FC<TwoColumnImageGridProps> = ({
  images,
  className = "",
}) => {
  return (
    <div className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2", className)}>
      {images.map((image, index) => (
        <ResponsiveImage 
          key={index} 
          src={image.src} 
          alt={image.alt} 
        />
      ))}
    </div>
  );
};

export default TwoColumnImageGrid;
