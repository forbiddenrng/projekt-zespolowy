interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "accent";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const variants = {
    default: "bg-secondary text-foreground",
    primary: "bg-primary text-white",
    accent: "bg-accent text-background",
  };

  return (
    <span
      className={`text-sm px-3 py-1 rounded-full ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}