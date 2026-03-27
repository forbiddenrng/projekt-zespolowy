import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CancelButton from "./CancelButton";

describe("CancelButton Component", () => {
  const mockOnClick = jest.fn();
  it("powinien poprawnie renderować przycisk z tekstem 'Cancel'", () => {
    render(<CancelButton onClick={mockOnClick} />);
    const button = screen.getByRole("button", { name: /Cancel/i });
    expect(button).toBeInTheDocument();
  });

  it("powinien być przyciskiem typu 'button' (nie wysyłać formularza domyślni)", () => {
    render(<CancelButton onClick={mockOnClick} />);
    const button = screen.getByRole("button", { name: /Cancel/i });
    expect(button).toHaveAttribute("type", "button");
  });

  it("powinien wywołać funkcję onClick po kliknięciu w przycisk", () => {
    render(<CancelButton onClick={mockOnClick} />);
    const button = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("powinien nakładać odpowiednie klasy stylujące Tailwind CSS", () => {
    const mockOnClick = jest.fn();
    render(<CancelButton onClick={mockOnClick} />);

    const button = screen.getByRole("button", { name: /Cancel/i });

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
      "cursor-pointer",
    );
  });
});
