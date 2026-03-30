import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DeleteButton from "./DeleteButton";

describe("DeleteButton Component", () => {
  const mockRemove = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("powinien poprawnie renderować przycisk z przekazanym atrybutem aria-label", () => {
    render(<DeleteButton prompt="Usuń element" remove={mockRemove} />);
    const button = screen.getByRole("button", { name: /Usuń element/i });
    expect(button).toBeInTheDocument();
  });

  it("powinien wywołać funkcję remove po kliknięciu w przycisk", () => {
    render(<DeleteButton prompt="Usuń projekt" remove={mockRemove} />);
    const button = screen.getByRole("button", { name: /Usuń projekt/i });
    fireEvent.click(button);
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it("powinien nakładać odpowiednie klasy stylujące Tailwind CSS na przycisk", () => {
    render(<DeleteButton prompt="Usuń" remove={mockRemove} />);
    const button = screen.getByRole("button", { name: /Usuń/i });
    expect(button).toHaveClass(
      "text-error",
      "cursor-pointer",
      "hover:text-red-400",
      "transition-colors",
      "p-1",
    );
  });

  it("powinien renderować ikonę SVG wewnątrz przycisku", () => {
    const { container } = render(
      <DeleteButton prompt="Skasuj" remove={mockRemove} />,
    );
    const svgIcon = container.querySelector("svg");
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveClass("h-5", "w-5");
  });
});
