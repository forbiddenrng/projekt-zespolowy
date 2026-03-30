import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EducationForm, { formatDateForInput } from "./UserEducation";
import { useWizard } from "../context/WizardContext";

jest.mock("../context/WizardContext", () => ({
  useWizard: jest.fn(),
}));

describe("EducationForm Component", () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();
  const mockUpdateEducation = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();

    (useWizard as jest.Mock).mockReturnValue({
      updateEducation: mockUpdateEducation,
      wizardData: { education: [] },
    });
  });

  describe("formatDateForInput helper", () => {
    it("powinien zwrócić pusty string, jeśli nie podano daty", () => {
      expect(formatDateForInput(undefined)).toBe("");
      expect(formatDateForInput("")).toBe("");
    });

    it("powinien poprawnie sformatować datę ISO na format yyyy-mm-dd", () => {
      expect(formatDateForInput("2024-05-15T10:00:00.00Z")).toBe("2024-05-15");
    });

    it("powinien zwrócić pusty string dla nieprawidłowego formatu daty", () => {
      expect(formatDateForInput("zla-data")).toBe("");
    });
  });

  describe("Renderowanie formularza", () => {
    it("powinien poprawnie renderować formularz z jednnym pusty wpisem, jeśli brak danych", () => {
      render(<EducationForm onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText("Education")).toBeInTheDocument();
      expect(screen.getByText("Education #1")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g. Warsaw University of Technology"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g. Computer Science"),
      ).toBeInTheDocument();
    });

    it("powinien ładować i poprawnie formatować dane początkowe z kontekstu", () => {
      (useWizard as jest.Mock).mockReturnValue({
        updateEducation: mockUpdateEducation,
        wizardData: {
          education: [
            {
              schoolName: "Test University",
              major: "Test Major",
              degree: "bachelor",
              beginDate: "2018-10-01T00:00:00.00Z",
              endDate: "2022-06-30T00:00:00.00Z",
            },
          ],
        },
      });
      render(<EducationForm onNext={mockOnNext} onBack={mockOnBack} />);

      expect(
        screen.getByPlaceholderText("e.g. Warsaw University of Technology"),
      ).toHaveValue("Test University");
      expect(screen.getByPlaceholderText("e.g. Computer Science")).toHaveValue(
        "Test Major",
      );
      expect(
        screen.getByRole("combobox", { name: /Degree \/ Title/i }),
      ).toHaveValue("bachelor");

      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs[0]).toHaveValue("2018-10-01");
      expect(dateInputs[1]).toHaveValue("2022-06-30");
    });

    it("powinien umożliwić nawigację wstecz", () => {
      render(<EducationForm onNext={mockOnNext} onBack={mockOnBack} />);
      const backButton = screen.getByRole("button", { name: /Back/i });
      fireEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("Dynamiczne zarządzanie listą (FieldArray)", () => {
    it("powinien pozwolić dodać kolejny wpis o edukacji", () => {
      render(<EducationForm onNext={mockOnNext} onBack={mockOnBack} />);

      fireEvent.click(
        screen.getByRole("button", { name: /Add another education entry/i }),
      );

      // Powinny być obecne dwie karty edukacyjne
      expect(screen.getByText("Education #1")).toBeInTheDocument();
      expect(screen.getByText("Education #2")).toBeInTheDocument();
    });

    it("powinien pozwolić usunąć wpis", async () => {
      (useWizard as jest.Mock).mockReturnValue({
        updateEducation: mockUpdateEducation,
        wizardData: {
          education: [
            {
              schoolName: "Szkoła 1",
              major: "Kierunek 1",
              degree: "master",
              beginDate: "2010-01-01",
            },
            {
              schoolName: "Szkoła 2",
              major: "Kierunek 2",
              degree: "bachelor",
              beginDate: "2015-01-01",
            },
          ],
        },
      });

      render(<EducationForm onNext={mockOnNext} onBack={mockOnBack} />);

      // Mamy dwie szkoły
      expect(screen.getByDisplayValue("Szkoła 1")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Szkoła 2")).toBeInTheDocument();

      const removeButtons = screen.getAllByRole("button", {
        name: /Remove education/i,
      });
      expect(removeButtons).toHaveLength(2);

      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByDisplayValue("Szkoła 1")).not.toBeInTheDocument();
        expect(screen.getByDisplayValue("Szkoła 2")).toBeInTheDocument();
      });
    });
  });

  describe("Walidacja i przesyłanie (Submit)", () => {
    it("powinien pokazać komunikaty o błędach, jeśli podjęto próbę wysłania pustego formularza", async () => {
      render(<EducationForm onNext={mockOnNext} onBack={mockOnBack} />);

      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByText("School name is required")).toBeInTheDocument();
        expect(
          screen.getByText("Major/Field of study is required"),
        ).toBeInTheDocument();
        expect(screen.getByText("Degree is required")).toBeInTheDocument();
        expect(screen.getByText("Start date is required")).toBeInTheDocument();
      });

      expect(mockUpdateEducation).not.toHaveBeenCalled();
      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it("powinien zgłosić błąd, jeśli data początkowa jest z przyszłości", async () => {
      render(<EducationForm onNext={mockOnNext} onBack={mockOnBack} />);

      const schoolInput = screen.getByPlaceholderText(
        "e.g. Warsaw University of Technology",
      );
      const majorInput = screen.getByPlaceholderText("e.g. Computer Science");
      const degreeSelect = screen.getByRole("combobox", {
        name: /Degree \/ Title/i,
      });
      const beginDateInput = document.querySelectorAll('input[type="date"]')[0]; // Start Date

      fireEvent.change(schoolInput, { target: { value: "Politechnika" } });
      fireEvent.change(majorInput, { target: { value: "Informatyka" } });
      fireEvent.change(degreeSelect, { target: { value: "engineer" } });

      fireEvent.change(beginDateInput, { target: { value: "2050-01-01" } });

      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Date cannot be in the future"),
        ).toBeInTheDocument();
      });

      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it("powinien zgłosić błąd, jeśli data końcowa jest wcześniejsza niż początkowa", async () => {
      render(<EducationForm onNext={mockOnNext} onBack={mockOnBack} />);

      const beginDateInput = document.querySelectorAll('input[type="date"]')[0];
      const endDateInput = document.querySelectorAll('input[type="date"]')[1];

      fireEvent.change(beginDateInput, { target: { value: "2020-01-01" } });
      fireEvent.change(endDateInput, { target: { value: "2018-01-01" } });

      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("End date must be after the start date"),
        ).toBeInTheDocument();
      });
    });

    it("powinien poprawnie zwalidować dane, sformatować je i przejść dalej", async () => {
      render(<EducationForm onNext={mockOnNext} onBack={mockOnBack} />);

      const schoolInput = screen.getByPlaceholderText(
        "e.g. Warsaw University of Technology",
      );
      const majorInput = screen.getByPlaceholderText("e.g. Computer Science");
      const degreeSelect = screen.getByRole("combobox", {
        name: /Degree \/ Title/i,
      });
      const beginDateInput = document.querySelectorAll('input[type="date"]')[0];
      const endDateInput = document.querySelectorAll('input[type="date"]')[1];

      fireEvent.change(schoolInput, {
        target: { value: "University of Technology" },
      });
      fireEvent.change(majorInput, {
        target: { value: "Software Engineering" },
      });
      fireEvent.change(degreeSelect, { target: { value: "master" } });
      fireEvent.change(beginDateInput, { target: { value: "2015-10-01" } });
      fireEvent.change(endDateInput, { target: { value: "2020-07-01" } });

      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(mockUpdateEducation).toHaveBeenCalledTimes(1);

        const submittedData = mockUpdateEducation.mock.calls[0][0];
        expect(submittedData).toHaveLength(1);
        expect(submittedData[0].schoolName).toBe("University of Technology");
        expect(submittedData[0].major).toBe("Software Engineering");
        expect(submittedData[0].degree).toBe("master");
        expect(submittedData[0].beginDate).toContain("2015-10-01");
        expect(submittedData[0].endDate).toContain("2020-07-01");
        expect(mockOnNext).toHaveBeenCalledTimes(1);
      });
    });

    it("powinien poprawnie przetworzyć formularz z pustą datą końcową (optional)", async () => {
      render(<EducationForm onNext={mockOnNext} onBack={mockOnBack} />);

      const schoolInput = screen.getByPlaceholderText(
        "e.g. Warsaw University of Technology",
      );
      const majorInput = screen.getByPlaceholderText("e.g. Computer Science");
      const degreeSelect = screen.getByRole("combobox", {
        name: /Degree \/ Title/i,
      });
      const beginDateInput = document.querySelectorAll('input[type="date"]')[0];

      fireEvent.change(schoolInput, {
        target: { value: "Current University" },
      });
      fireEvent.change(majorInput, { target: { value: "Computer Sciense" } });
      fireEvent.change(degreeSelect, { target: { value: "bachelor" } });
      fireEvent.change(beginDateInput, { target: { value: "2023-10-01" } });

      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(mockUpdateEducation).toHaveBeenCalledTimes(1);

        const submittedData = mockUpdateEducation.mock.calls[0][0];
        expect(submittedData[0].endDate).toBeUndefined();
        expect(mockOnNext).toHaveBeenCalledTimes(1);
      });
    });
  });
});
