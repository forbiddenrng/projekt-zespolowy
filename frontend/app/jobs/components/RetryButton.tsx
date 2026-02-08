"use client";

export default function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:opacity-90"
    >
      Sprobuj ponownie
    </button>
  );
}