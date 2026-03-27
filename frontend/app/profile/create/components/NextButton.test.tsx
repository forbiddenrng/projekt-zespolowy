import React from "react";
import { render, screen } from "@testing-library/react";
import NextButton from "./NextButton";

describe("NextButton Component", () => {
  it("powinien poprawnie renderować przekazany tekst (propt)", () => {
    render(<NextButton prompt="Zapisz i kontynuuj" isSubmitting={false} />);
    const button = screen.getByRole("button", { name: /Zapisz i kontynuuj/i });
    expect(button).toBeInTheDocument();
  });

  it("powinien być przyciskiem typu 'submit'", () => {
    render(<NextButton prompt="Dalej" isSubmitting={false} />);
    const button = screen.getByRole("button", { name: /Dalej/i });
    expect(button).toHaveAttribute("type", "submit");
  });

  it("nie powinien być zablkowoany, gdy isSubmitting wynosi falso", () => {
    render(<NextButton prompt="Zapisz" isSubmitting={false} />);
    const button = screen.getByRole("button", { name: /Zapisz/i });
    expect(button).not.toBeDisabled();
  });

  it("powinien być zablkowany (disabled), gdy isSubmitting wynosi true", () => {
    render(<NextButton prompt="Zapisywanie..." isSubmitting={true} />);
    const button = screen.getByRole("button", { name: /Zapisywanie.../i });
    expect(button).toBeDisabled();
  });

  it("powinien nakładać dopowiednie klasy stylujące Tailwind CSS", () => {
    render(<NextButton prompt="Dalej" isSubmitting={false} />);
    const button = screen.getByRole("button", { name: /Dalej/i });
    expect(button).toHaveClass(
      "px-6",
      "py-3",
      "bg-primary",
      "hover:bg-primary_hover",
      "text-white",
      "rounded-lg",
      "font-semibold",
      "transition-colors",
      "duration-200",
      "shadow-sm",
      "disabled:opacity-50",
      "disabled:cursor-not-allowed",
      "flex",
      "items-center",
      "gap-2",
      "cursor-pointer",
    );
  });

  it("powinien renderować ikonę SVG (strzałkę) wewnątrz przycisku", () => {
    const { container } = render(
      <NextButton prompt="Dalej" isSubmitting={false} />,
    );
    const svgIcon = container.querySelector("svg");
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveClass("h-5", "w-5");
  });
});
