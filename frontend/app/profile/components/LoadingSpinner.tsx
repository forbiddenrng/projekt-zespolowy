interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({
  message = "Ładowanie...",
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-10 h-10 border-4 border-secondary border-t-primary rounded-full animate-spin mb-4"></div>
      <p className="text-muted">{message}</p>
    </div>
  );
}