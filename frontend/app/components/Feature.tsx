const iconColorMap = {
  accent: {
    bg: "bg-accent/10",
    text: "text-accent",
  },
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
  },
  success: {
    bg: "bg-success/10",
    text: "text-success",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
  },
} as const;

interface FeatureProps {
  title: string;
  description: string;
  iconColor?: keyof typeof iconColorMap;
}

export default function Feature({
  title,
  description,
  iconColor = "accent",
}: FeatureProps) {
  const { bg, text } = iconColorMap[iconColor];

  return (
    <div className="bg-card_background border border-card_border rounded-xl p-8 hover:shadow-xl transition-shadow duration-300">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${bg}`}
      >
        <svg
          className={`w-6 h-6 ${text}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted leading-relaxed">{description}</p>
    </div>
  );
}
