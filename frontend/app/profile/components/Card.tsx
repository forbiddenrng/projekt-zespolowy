import EditButton from "./EditButton";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  editHref?: string;
}

export default function Card({ children, className = "", editHref }: CardProps) {
  return (
    <div
      className={`p-6 relative bg-card-background border border-card-border rounded-lg shadow ${className}`}
    >
      {editHref && (
        <div className="absolute top-4 right-4">
          <EditButton href={editHref} />
        </div>
      )}
      <div className={editHref ? "pr-12" : ""}>
        {children}
      </div>
    </div>
  );
}