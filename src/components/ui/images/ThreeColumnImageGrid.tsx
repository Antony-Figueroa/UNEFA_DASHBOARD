import { cn } from "../../../utils/cn";
import ResponsiveImage from "./ResponsiveImage";

/**
 * Props for the ThreeColumnImageGrid component.
 */
interface ThreeColumnImageGridProps {
  /** Array of images to display in the grid. */
  images: {
    src: string;
    alt: string;
  }[];
  /** Additional CSS classes for the grid container. */
  className?: string;
}

/**
 * A responsive three-column grid for images.
 * Automatically switches to one or two columns on smaller screens.
 * 
 * @example
 * ```tsx
 * <ThreeColumnImageGrid 
 *   images={[
 *     { src: "/img1.png", alt: "Image 1" },
 *     { src: "/img2.png", alt: "Image 2" },
 *     { src: "/img3.png", alt: "Image 3" }
 *   ]} 
 * />
 * ```
 */
export const ThreeColumnImageGrid: React.FC<ThreeColumnImageGridProps> = ({
  images,
  className = "",
}) => {
  return (
    <div className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3", className)}>
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

export default ThreeColumnImageGrid;
