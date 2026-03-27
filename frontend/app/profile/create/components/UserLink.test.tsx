import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LinksForm from "./UserLink";
import { useWizard } from "../context/WizardContext";

jest.mock("../context/WizardContext", () => ({
  useWizard: jest.fn(),
}));

describe("LinksForm Component", () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();
  const mockUpdateLinks = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useWizard as jest.Mock).mockReturnValue({
      updateLinks: mockUpdateLinks,
      wizardData: { links: [] },
    });
  });

  describe("Renderowanie i ładowanie danych", () => {
    it("powinien wyrenderować formularz z jednym pustym polem na start", () => {
      render(<LinksForm onNext={mockOnNext} onBack={mockOnBack} />);

      expect(screen.getByText("Links")).toBeInTheDocument();
      expect(screen.getByText("Link #1")).toBeInTheDocument();

      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(1);
      expect(inputs[0]).toHaveValue("");
    });

    it("powinien załadować dane z kontekstu wizarda, jeśli istnieją", () => {
      (useWizard as jest.Mock).mockReturnValue({
        updateLinks: mockUpdateLinks,
        wizardData: {
          links: [
            { linkString: "https://github.com/jankowalski" },
            { linkString: "https://linkedin.com/in/jankowalski" },
          ],
        },
      });

      render(<LinksForm onNext={mockOnNext} onBack={mockOnBack} />);

      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(2);
      expect(inputs[0]).toHaveValue("https://github.com/jankowalski");
      expect(inputs[1]).toHaveValue("https://linkedin.com/in/jankowalski");
    });
  });

  describe("Zarządzanie listą linków", () => {
    it("powinien dodać nowe pole po kliknięciu 'Add another link'", () => {
      render(<LinksForm onNext={mockOnNext} onBack={mockOnBack} />);

      const addButton = screen.getByRole("button", {
        name: /Add another link/i,
      });
      fireEvent.click(addButton);

      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(2);
      expect(screen.getByText("Link #1")).toBeInTheDocument();
      expect(screen.getByText("Link #2")).toBeInTheDocument();
    });

    it("powinien usunąć pole po kliknięciu 'Remove link'", async () => {
      (useWizard as jest.Mock).mockReturnValue({
        updateLinks: mockUpdateLinks,
        wizardData: {
          links: [
            { linkString: "https://site1.com" },
            { linkString: "https://site2.com" },
          ],
        },
      });

      render(<LinksForm onNext={mockOnNext} onBack={mockOnBack} />);

      const removeButtons = screen.getAllByRole("button", {
        name: /Remove link/i,
      });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox");
        expect(inputs).toHaveLength(1);
        expect(inputs[0]).toHaveValue("https://site2.com");
      });
    });
  });

  describe("Walidacja i przesyłanie (Submit)", () => {
    it("powinien wyświetlić błąd walidacji, jeśli pole jest puste podczas próby zapisu", async () => {
      render(<LinksForm onNext={mockOnNext} onBack={mockOnBack} />);

      const nextButton = screen.getByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText("Link is required")).toBeInTheDocument();
      });

      expect(mockUpdateLinks).not.toHaveBeenCalled();
      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it("powinien wyświetlić błąd walidacji, jeśli podano nieprawidłowy format URL", async () => {
      render(<LinksForm onNext={mockOnNext} onBack={mockOnBack} />);

      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "to-nie-jest-link" } });

      const nextButton = screen.getByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText("Please enter a valid URL (e.g., https://...)"),
        ).toBeInTheDocument();
      });

      expect(mockUpdateLinks).not.toHaveBeenCalled();
    });

    it("powinien poprawnie zapisać poprawne dane do kontekstu i wywołać onNext", async () => {
      render(<LinksForm onNext={mockOnNext} onBack={mockOnBack} />);

      const input = screen.getByRole("textbox");

      fireEvent.change(input, {
        target: { value: "https://mojestronawww.pl" },
      });

      const nextButton = screen.getByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockUpdateLinks).toHaveBeenCalledTimes(1);
        expect(mockUpdateLinks).toHaveBeenCalledWith([
          { linkString: "https://mojestronawww.pl" },
        ]);
        expect(mockOnNext).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Nawigacja wstecz", () => {
    it("powinien wywołać funkcję onBack po kliknięciu 'Back'", () => {
      render(<LinksForm onNext={mockOnNext} onBack={mockOnBack} />);

      const backButton = screen.getByRole("button", { name: /Back/i });
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });
});
