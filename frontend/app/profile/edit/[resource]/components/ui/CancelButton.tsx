export default function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-6 py-3 bg-secondary border border-border text-foreground hover:bg-border rounded-lg font-medium transition-colors duration-200 cursor-pointer"
    >
      Cancel
    </button>
  );
}
