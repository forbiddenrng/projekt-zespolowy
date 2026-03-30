import "jest-location-mock"; // Magia dzieje się tutaj
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RetryButton from "./RetryButton";

describe("RetryButton Component", () => {
  beforeEach(() => {
    // Biblioteka automatycznie zamienia window.location na w pełni konfigurowalny mock.
    // Dzięki temu możemy po prostu wyczyścić licznik wywołań przed każdym testem.
    if (jest.isMockFunction(window.location.reload)) {
      (window.location.reload as jest.Mock).mockClear();
    }
  });

  it("powinien poprawnie renderować przycisk", () => {
    render(<RetryButton />);

    const button = screen.getByRole("button", { name: /Try Again/i });
    expect(button).toBeInTheDocument();
  });

  it("powinien posiadać odpowiednie klasy stylujące", () => {
    render(<RetryButton />);

    const button = screen.getByRole("button", { name: /Try Again/i });
    expect(button).toHaveClass(
      "px-8",
      "py-3",
      "bg-primary",
      "text-white",
      "rounded-2xl",
      "font-bold",
      "hover:opacity-90",
    );
  });

  it("powinien odświeżyć stronę (wywołać window.location.reload) po kliknięciu", () => {
    render(<RetryButton />);

    const button = screen.getByRole("button", { name: /Try Again/i });
    fireEvent.click(button);

    // Biblioteka sprawia, że to wywołanie jest teraz bezpieczne i weryfikowalne
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
