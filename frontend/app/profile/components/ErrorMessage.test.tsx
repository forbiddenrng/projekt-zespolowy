import React from "react";
import { render, screen } from "@testing-library/react";
import ErrorMessage from "./ErrorMessage";

describe("ErrorMessage Component", () => {
  it("powinien poprawnie renderować przekazaną wiadomość", () => {
    render(<ErrorMessage message="Wystąpił nieoczekiwany błąd serwera" />);
    expect(
      screen.getByText("Wystąpił nieoczekiwany błąd serwera"),
    ).toBeInTheDocument();
  });

  it("powinien nakładać odpowiednie klasy stylujące na główny kontener, wewnętrzne pudełko i tekst", () => {
    const { container } = render(<ErrorMessage message="Błąd logowania" />);
    expect(container.firstChild).toHaveClass(
      "flex",
      "items-center",
      "justify-center",
      "py-12",
    );

    const innerWrapper = container.firstChild?.firstChild;
    expect(innerWrapper).toHaveClass(
      "bg-error/10",
      "border",
      "border-error/30",
      "rounded-lg",
      "p-4",
      "flex",
      "items-center",
      "gap-3",
    );

    const textElement = screen.getByText("Błąd logowania");
    expect(textElement).toHaveClass("text-error", "font-medium");
  });
});
