import React from "react";
import { render, screen } from "@testing-library/react";
import SectionHeader from "./SectionHeader";

describe("SectionHeader Component", () => {
  it("powinien poprawnie renderować przekazany tytuł jako nagłówek h2", () => {
    render(<SectionHeader title="Moje Doświadczenie" />);
    const headingElement = screen.getByRole("heading", { level: 2 });
    expect(headingElement).toBeInTheDocument();
    expect(headingElement).toHaveTextContent("Moje Doświadczenie");
  });

  it("nie powinien renderować kontenera ikony, jeśli prop icon nie został przekazny", () => {
    const { container } = render(<SectionHeader title="Sekcja Bez Ikony" />);
    const iconWrapper = container.querySelector(".text-primary");
    expect(iconWrapper).not.toBeInTheDocument();
  });

  it("powinien renderować przekazaną ikonę w odpowiednim wrapperze", () => {
    const MockIcon = <svg data-testid="mock-icon" />;
    render(<SectionHeader title="Sekcja z ikoną" icon={MockIcon} />);

    const iconElement = screen.getByTestId("mock-icon");
    expect(iconElement).toBeInTheDocument();

    const iconWrapper = iconElement.parentElement;
    expect(iconWrapper).toHaveClass("text-primary");
  });

  it("powinien nakładać odpowiednie klasy stylujące na główny kontener i tytuł", () => {
    const { container } = render(<SectionHeader title="Test klas" />);
    expect(container.firstChild).toHaveClass(
      "flex",
      "items-center",
      "gap-2",
      "mb-4",
    );

    const headingElement = screen.getByRole("heading", { level: 2 });
    expect(headingElement).toHaveClass(
      "text-xl",
      "font-semibold",
      "text-foreground",
    );
  });
});
