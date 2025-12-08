interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
}

export default function SectionHeader({ title, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-primary">{icon}</span>}
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    </div>
  );
}