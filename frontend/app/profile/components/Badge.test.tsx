import React from "react";
import { render, screen } from "@testing-library/react";
import Badge from "./Badge";

describe("Badge Component", () => {
  it("powinien poprawnie renderować przekazany tekst (children)", () => {
    render(<Badge>Testowy Badge</Badge>);
    expect(screen.getByText("Testowy Badge")).toBeInTheDocument();
  });

  it("powinien nakładać bazowe klasy stylujące niezależnie od wariantu", () => {
    render(<Badge>Baza</Badge>);
    const badgeElement = screen.getByText("Baza");
    expect(badgeElement).toHaveClass("text-sm", "px-3", "py-1", "rounded-full");
  });

  it("powinien nakładać klasy warianty 'default', gdy nie podano propsa variant", () => {
    render(<Badge>Domyślny</Badge>);
    const badgeElement = screen.getByText("Domyślny");
    expect(badgeElement).toHaveClass("bg-secondary", "text-foreground");
  });

  it("powinien nakładać poprawne klasy dla wariantu 'primary'", () => {
    render(<Badge variant="primary">Główny</Badge>);
    const badgeElement = screen.getByText("Główny");
    expect(badgeElement).toHaveClass("bg-primary", "text-white");
    expect(badgeElement).not.toHaveClass("bg-secondary", "text-foreground");
  });

  it("powinien nakładać klasy dla wariantu 'accent'", () => {
    render(<Badge variant="accent">Akcent</Badge>);
    const badgeElement = screen.getByText("Akcent");
    expect(badgeElement).toHaveClass("bg-accent", "text-background");
  });

  it("powinien poprawnie doklejać niestandardowe klasy z propsa 'className'", () => {
    render(<Badge className="mt-4 hover:bg-red-500">Custom Klasy</Badge>);
    const badgeElement = screen.getByText("Custom Klasy");
    expect(badgeElement).toHaveClass("mt-4", "hover:bg-red-500");
    expect(badgeElement).toHaveClass("rounded-full", "bg-secondary");
  });
});
