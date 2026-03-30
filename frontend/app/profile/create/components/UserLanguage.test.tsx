import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserLanguages from "./UserLanguage";
import { useWizard } from "../context/WizardContext";

jest.mock("../context/WizardContext", () => ({
  useWizard: jest.fn(),
}));

jest.mock("../../../../app/ts/types", () => ({
  LanguageLevel: {
    A1: "A1",
    A2: "A2",
    B1: "B1",
    B2: "B2",
    C1: "C1",
    C2: "C2",
    Native: "Native",
  },
}));

describe("UserLanguages Component", () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();
  const mockUpdateLanguages = jest.fn();

  const mockAllLanguages = [
    { id: 1, name: "Angielski", code: "EN" },
    { id: 2, name: "Hiszpański", code: "ES" },
    { id: 3, name: "Niemiecki", code: "DE" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (useWizard as jest.Mock).mockReturnValue({
      updateLanguages: mockUpdateLanguages,
      wizardData: { languages: [] },
    });
  });

  describe("Renderowanie i ładowanie danych", () => {
    it("powinien renderować formularz z jednym pustym polem na start", () => {
      render(
        <UserLanguages
          onNext={mockOnNext}
          onBack={mockOnBack}
          allLanguages={mockAllLanguages}
        />,
      );

      expect(screen.getByText("Languages")).toBeInTheDocument();
      expect(screen.getByText("Language #1")).toBeInTheDocument();

      const selects = screen.getAllByRole("combobox");
      expect(selects).toHaveLength(2);
      expect(selects[0]).toHaveValue("");
    });

    it("powinien ładować i wyświetlać dane początkowe z kontekstu wizarda", () => {
      (useWizard as jest.Mock).mockReturnValue({
        updateLanguages: mockUpdateLanguages,
        wizardData: {
          languages: [
            { languageId: 1, level: "B2" },
            { languageId: 2, level: "A1" },
          ],
        },
      });

      render(
        <UserLanguages
          onNext={mockOnNext}
          onBack={mockOnBack}
          allLanguages={mockAllLanguages}
        />,
      );

      expect(screen.getByText("Language #1")).toBeInTheDocument();
      expect(screen.getByText("Language #2")).toBeInTheDocument();

      const selects = screen.getAllByRole("combobox");
      expect(selects).toHaveLength(4);
      expect(selects[0]).toHaveValue("1");
      expect(selects[1]).toHaveValue("B2");
      expect(selects[2]).toHaveValue("2");
      expect(selects[3]).toHaveValue("A1");
    });
  });

  describe("Zarządzanie listą języków", () => {
    it("powinien dodać nowy język po kliknięciu przycisku 'Add another language'", () => {
      render(
        <UserLanguages
          onNext={mockOnNext}
          onBack={mockOnBack}
          allLanguages={mockAllLanguages}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /Add another language/i }),
      );

      expect(screen.getByText("Language #1")).toBeInTheDocument();
      expect(screen.getByText("Language #2")).toBeInTheDocument();
      expect(screen.getAllByRole("combobox")).toHaveLength(4);
    });

    it("powinien usunąć pole po kliknięciu przycisku 'Remove language'", async () => {
      (useWizard as jest.Mock).mockReturnValue({
        updateLanguages: mockUpdateLanguages,
        wizardData: {
          languages: [
            { languageId: 1, level: "B2" },
            { languageId: 2, level: "A1" },
          ],
        },
      });

      render(
        <UserLanguages
          onNext={mockOnNext}
          onBack={mockOnBack}
          allLanguages={mockAllLanguages}
        />,
      );

      const removeButtons = screen.getAllByRole("button", {
        name: /Remove language/i,
      });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText("Language #2")).not.toBeInTheDocument();
        const selects = screen.getAllByRole("combobox");
        expect(selects[0]).toHaveValue("2");
      });
    });

    it("powinien wywołać funkcję onBack po kliknięciu 'Back'", () => {
      render(
        <UserLanguages
          onNext={mockOnNext}
          onBack={mockOnBack}
          allLanguages={mockAllLanguages}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /Back/i }));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("Walidacja i Submisja", () => {
    it("powinien pokazać błąd, jeśli podjęto próbę zapisu bez wyboru języka", async () => {
      render(
        <UserLanguages
          onNext={mockOnNext}
          onBack={mockOnBack}
          allLanguages={mockAllLanguages}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Please select a language"),
        ).toBeInTheDocument();
      });

      expect(mockUpdateLanguages).not.toHaveBeenCalled();
    });

    it("powinien pokazać błąd walidacji, jeśli użytkownik wybrał ten sam język dwa razy", async () => {
      render(
        <UserLanguages
          onNext={mockOnNext}
          onBack={mockOnBack}
          allLanguages={mockAllLanguages}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /Add another language/i }),
      );

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "1" } });
      fireEvent.change(selects[2], { target: { value: "1" } });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(
          screen.getByText(
            "You cannot select the same language more than once.",
          ),
        ).toBeInTheDocument();
      });

      expect(mockUpdateLanguages).not.toHaveBeenCalled();
    });

    it("powinien poprawnie zwalidować i wysłać dane do kontekstu, jeśli wszystkie pola są prawidłowe", async () => {
      render(
        <UserLanguages
          onNext={mockOnNext}
          onBack={mockOnBack}
          allLanguages={mockAllLanguages}
        />,
      );

      const selects = screen.getAllByRole("combobox");

      fireEvent.change(selects[0], { target: { value: "2" } });
      fireEvent.change(selects[1], { target: { value: "C1" } });

      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(mockUpdateLanguages).toHaveBeenCalledTimes(1);

        const submittedData = mockUpdateLanguages.mock.calls[0][0];
        expect(submittedData).toHaveLength(1);
        expect(submittedData[0].languageId).toBe(2);
        expect(submittedData[0].level).toBe("C1");

        expect(mockOnNext).toHaveBeenCalledTimes(1);
      });
    });
  });
});
