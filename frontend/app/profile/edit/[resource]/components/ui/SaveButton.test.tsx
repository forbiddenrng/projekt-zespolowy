import React from "react";
import { render, screen } from "@testing-library/react";
import SaveButton from "./SaveButton";

describe("SaveButton Component", () => {
  it("powinien poprawnie renderować domyślny tekst 'Save', gdy isSubmitting wynosi false", () => {
    render(<SaveButton isSubmitting={false} />);
    const button = screen.getByRole("button", { name: /Save/i });
    expect(button).toBeInTheDocument();
  });

  it("powinien być przyciskiem typu 'submit'", () => {
    render(<SaveButton isSubmitting={false} />);
    const button = screen.getByRole("button", { name: /Save/i });
    expect(button).toHaveAttribute("type", "submit");
  });

  it("nie powinien być zablokowany, gdy isSubmitting wynosi false", () => {
    render(<SaveButton isSubmitting={false} />);
    const button = screen.getByRole("button", { name: /Save/i });
    expect(button).not.toBeDisabled();
  });

  it("powinien zmieniać tekst na 'Saving...', blokować przycisk (disabled) i wyświetlać spinner, gdy isSubmitting wynosi true", () => {
    const { container } = render(<SaveButton isSubmitting={true} />);
    const button = screen.getByRole("button", { name: /Saving.../i });
    expect(button).toBeDisabled();
    expect(button).toBeInTheDocument();

    const spinnerSvg = container.querySelector("svg.animate-spin");
    expect(spinnerSvg).toBeInTheDocument();
  });

  it("powinien nakładać odpowiednie klasy stylujące Tailwind CSS", () => {
    render(<SaveButton isSubmitting={false} />);

    const button = screen.getByRole("button", { name: /Save/i });

    // Weryfikujemy kluczowe klasy odpowiedzialne za układ, kolory i stany
    expect(button).toHaveClass(
      "flex",
      "items-center",
      "justify-center",
      "gap-2",
      "px-6",
      "py-3",
      "bg-primary",
      "text-secondary",
      "hover:bg-primary/90",
      "rounded-lg",
      "font-medium",
      "transition-colors",
      "duration-200",
      "cursor-pointer",
      "disabled:opacity-50",
      "disabled:cursor-not-allowed",
      "min-w-[120px]",
    );
  });
});
