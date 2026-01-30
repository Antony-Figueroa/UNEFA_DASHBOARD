import { cn } from "../../../utils/cn";

/**
 * Props for the AspectRatioVideo component.
 */
interface AspectRatioVideoProps {
  /** URL of the video to embed. */
  videoUrl: string;
  /** Aspect ratio class (e.g., "video", "square", "21/9"). Defaults to "video" (16/9). */
  aspectRatio?: string;
  /** Title for the iframe accessibility. */
  title?: string;
  /** Additional CSS classes for the container. */
  className?: string;
}

/**
 * A responsive video embed component that maintains a specific aspect ratio.
 * 
 * @example
 * ```tsx
 * <AspectRatioVideo 
 *   videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ" 
 *   aspectRatio="video" 
 * />
 * ```
 */
const AspectRatioVideo: React.FC<AspectRatioVideoProps> = ({
  videoUrl,
  aspectRatio = "video",
  title = "Embedded Video",
  className = "",
}) => {
  return (
    <div className={cn(
      "overflow-hidden rounded-xl border border-border-light dark:border-border-dark",
      `aspect-${aspectRatio}`,
      className
    )}>
      <iframe
        src={videoUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
};

export default AspectRatioVideo;
