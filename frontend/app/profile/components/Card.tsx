interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`p-6 bg-card-background border border-card-border rounded-lg shadow ${className}`}
    >
      {children}
    </div>
  );
}