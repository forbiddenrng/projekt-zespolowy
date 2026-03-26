import React from "react";
import { render, screen } from "@testing-library/react";
import EmptyState from "./EmptyState";

jest.mock("next/link", () => {
  return ({ children, href, className }: any) => {
    return (
      <a href={href} className={className} data-testid="empty-state-link">
        {children}
      </a>
    );
  };
});

describe("EmptyState Component", () => {
  it("powinien poprawnie renderować przekazaną wiadomość (message)", () => {
    render(<EmptyState message="Nie masz jeszcze żadnych projektów." />);
    expect(
      screen.getByText("Nie masz jeszcze żadnych projektów."),
    ).toBeInTheDocument();
  });

  it("powinien renderować domyślny przycisk akcji ('Dodaj') i domyślny link ('/profile/edit'), gdy nie podano propsów", () => {
    render(<EmptyState message="Brak danych" />);
    const linkElement = screen.getByTestId("empty-state-link");
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveTextContent("Dodaj");
    expect(linkElement).toHaveAttribute("href", "/profile/edit");
  });

  it("powinien renderować niestandardową etykietę i link, gdy podano actionLabel i actionHref", () => {
    render(
      <EmptyState
        message="Lista jest pusta"
        actionLabel="Utwórz nowy"
        actionHref="/projects/new"
      />,
    );
    const linkElement = screen.getByTestId("empty-state-link");
    expect(linkElement).toHaveTextContent("Utwórz nowy");
    expect(linkElement).toHaveAttribute("href", "/projects/new");
  });

  it("powinien nakładać odpowiednie klasy stylujące na główny kontener i elementy wewnętrzne", () => {
    const { container } = render(<EmptyState message="Test klas" />);

    // Sprawdzamy klasy głównego kontenera
    expect(container.firstChild).toHaveClass(
      "flex",
      "flex-col",
      "items-center",
      "justify-center",
      "py-6",
      "text-center",
    );

    // Sprawdzamy klasy dla wiadomości (tekstu)
    const messageElement = screen.getByText("Test klas");
    expect(messageElement).toHaveClass("text-muted", "mb-4");

    // Sprawdzamy klasy przycisku (linku)
    const linkElement = screen.getByTestId("empty-state-link");
    expect(linkElement).toHaveClass(
      "inline-flex",
      "items-center",
      "gap-2",
      "bg-primary",
      "hover:bg-primary-hover",
      "text-white",
      "font-medium",
      "py-2",
      "px-4",
      "rounded-lg",
      "transition-colors",
      "duration-200",
    );
  });
});
