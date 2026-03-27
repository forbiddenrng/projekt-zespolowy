import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AddPosition from "./AddPosition";

describe("AddPosition Component", () => {
  const mockOnClick = jest.fn();

  it("powinien poprawnie renderować przekazany tekst (prompt)", () => {
    render(<AddPosition prompt="dodaj nową pozycję" onClick={mockOnClick} />);
    const button = screen.getByRole("button", { name: /Dodaj nową pozycję/i });
    expect(button).toBeInTheDocument();
  });

  it("powinien wywołać funkcję onClick po kliknięciu w przycisk", () => {
    render(<AddPosition prompt="dodaj nową pozycję" onClick={mockOnClick} />);
    const button = screen.getByRole("button", { name: /Dodaj nową pozycję/i });
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("powinien nakładać odpowiednie klasy stylujące Tailwind CSS", () => {
    render(<AddPosition prompt="dodaj nową pozycję" onClick={mockOnClick} />);
    const button = screen.getByRole("button", { name: /Dodaj/i });

    expect(button).toHaveClass(
      "w-full",
      "p-3",
      "border-2",
      "border-dashed",
      "border-border",
      "rounded-lg",
      "text-muted",
      "hover:text-foreground",
      "hover:border-primary",
      "transition-all",
      "cursor-pointer",
      "flex",
      "items-center",
      "justify-center",
      "gap-2",
    );
  });

  it("powinien renderować ikonę SVG z react-icons wewnątrz przycisku", () => {
    const { container } = render(
      <AddPosition prompt="Dodaj element" onClick={mockOnClick} />,
    );
    const svgIcon = container.querySelector("svg");
    expect(svgIcon).toBeInTheDocument();
  });
});
