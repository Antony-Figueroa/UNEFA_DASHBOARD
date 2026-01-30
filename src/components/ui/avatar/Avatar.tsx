import { cn } from "../../../utils/cn";

interface AvatarProps {
  /** URL of the avatar image */
  src?: string;
  /** Alt text for the avatar image */
  alt?: string;
  /** Avatar size variant */
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";
  /** Status indicator (online, offline, busy, none) */
  status?: "online" | "offline" | "busy" | "none";
  /** Additional CSS classes for the container */
  className?: string;
  /** Initial letters to show if src is missing or fails */
  initials?: string;
}

const sizeClasses = {
  xsmall: "h-6 w-6",
  small: "h-8 w-8",
  medium: "h-10 w-10",
  large: "h-12 w-12",
  xlarge: "h-14 w-14",
  xxlarge: "h-16 w-16",
};

const statusSizeClasses = {
  xsmall: "h-1.5 w-1.5",
  small: "h-2 w-2",
  medium: "h-2.5 w-2.5",
  large: "h-3 w-3",
  xlarge: "h-3.5 w-3.5",
  xxlarge: "h-4 w-4",
};

const statusColorClasses = {
  online: "bg-success-500",
  offline: "bg-error-400",
  busy: "bg-warning-500",
  none: "",
};

/**
 * Avatar component to display user profile pictures or initials with optional status.
 * 
 * @example
 * ```tsx
 * <Avatar src="/path/to/img.jpg" size="large" status="online" />
 * <Avatar initials="JD" size="medium" />
 * ```
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "User Avatar",
  size = "medium",
  status = "none",
  className,
  initials,
}) => {
  return (
    <div className={cn("relative rounded-full shrink-0", sizeClasses[size], className)}>
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className="h-full w-full object-cover rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-bg-secondary text-text-primary dark:bg-white/10 dark:text-white font-medium uppercase text-xs">
          {initials?.substring(0, 2) || "?"}
        </div>
      )}

      {status !== "none" && (
        <span
          role="status"
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-[1.5px] border-bg-main dark:border-bg-dark",
            statusSizeClasses[size],
            statusColorClasses[status]
          )}
        />
      )}
    </div>
  );
};

export default Avatar;

