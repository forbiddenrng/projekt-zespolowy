import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BackButton from "./BackButton";

describe("BackButton Component", () => {
  const mockOnBack = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("powinien poprawnie renderować przekazany tekst (prompt)", () => {
    render(<BackButton prompt="Wróć do ustawień" onBack={mockOnBack} />);
    const button = screen.getByRole("button", { name: /Wróć do ustawień/i });
    expect(button).toBeInTheDocument();
  });

  it("powinien wywołać funkcję onBack po kliknięciu w przycisk", () => {
    render(<BackButton prompt="Wstecz" onBack={mockOnBack} />);
    const button = screen.getByRole("button", { name: /Wstecz/i });
    fireEvent.click(button);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it("powinien nakładać odpowiednie klasy stylujące Tailwind CSS", () => {
    render(<BackButton prompt="Cofnij" onBack={mockOnBack} />);
    const button = screen.getByRole("button", { name: /Cofnij/i });
    expect(button).toHaveClass(
      "px-6",
      "py-3",
      "bg-secondary",
      "border",
      "border-border",
      "text-foreground",
      "hover:bg-border",
      "rounded-lg",
      "font-medium",
      "transition-colors",
      "duration-200",
      "flex",
      "items-center",
      "gap-2",
      "cursor-pointer",
    );
  });

  it("powinien renderować ikonę SVG wewnątrz przycisku", () => {
    const { container } = render(
      <BackButton prompt="Wstecz" onBack={mockOnBack} />,
    );
    const svgIcon = container.querySelector("svg");
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveClass("h-5", "w-5");
  });
});
