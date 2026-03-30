import React from "react";
import { render, screen } from "@testing-library/react";
import LoadingSpinner from "./LoadingSpinner";

describe("LoadingSpinner Component", () => {
  it("powinien renderować domyślną wiadomość ('Ładowanie...'), gdy nie podano propsa message", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();
  });

  it("powinien renderować niestandardową wiadomość przekazaną w propsie", () => {
    render(<LoadingSpinner message="Trwa pobieranie danych..." />);
    expect(screen.getByText("Trwa pobieranie danych...")).toBeInTheDocument();
  });

  it("powinien posiadać odpowiednie klasy stylujące na głównym kontenerze", () => {
    const { container } = render(<LoadingSpinner />);

    // Główny kontener to pierwsze dziecko wyrenderowane przez komponent
    expect(container.firstChild).toHaveClass(
      "flex",
      "flex-col",
      "items-center",
      "justify-center",
      "py-12",
    );
  });

  it("powinien wyrenderować animowany element spinnera z prawidłowymi klasami", () => {
    const { container } = render(<LoadingSpinner />);

    // Szukamy elementu spinnera po unikalnej dla niego klasie animacji
    const spinnerElement = container.querySelector(".animate-spin");

    expect(spinnerElement).toBeInTheDocument();
    expect(spinnerElement).toHaveClass(
      "w-10",
      "h-10",
      "border-4",
      "border-secondary",
      "border-t-primary",
      "rounded-full",
      "mb-4",
    );
  });

  it("powinien nakładać klasę text-muted na element z wiadomością", () => {
    render(<LoadingSpinner message="Test text" />);

    const messageElement = screen.getByText("Test text");
    expect(messageElement).toHaveClass("text-muted");
  });
});
