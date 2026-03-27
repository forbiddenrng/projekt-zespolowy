import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WorkExpForm, { formatDateForInput } from "./UserWorkExperience";
import { useWizard } from "../context/WizardContext";

jest.mock("../context/WizardContext", () => ({
  useWizard: jest.fn(),
}));

describe("WorkExpForm Component", () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();
  const mockUpdateWorkExperience = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useWizard as jest.Mock).mockReturnValue({
      updateWorkExperience: mockUpdateWorkExperience,
      wizardData: { workExperience: [] },
    });
  });

  describe("formatDateForInput helper", () => {
    it("powinien zwrócić pusty string dla wartości niezdefiniowanych", () => {
      expect(formatDateForInput(undefined)).toBe("");
      expect(formatDateForInput("")).toBe("");
    });

    it("powinien sformatować poprawną datę do standardu YYYY-MM-DD", () => {
      expect(formatDateForInput("2021-05-15T00:00:00.000Z")).toBe("2021-05-15");
    });

    it("powinien zwrócić pusty string dla nieprawidłowego formatu daty", () => {
      expect(formatDateForInput("invalid-date")).toBe("");
    });
  });

  describe("Renderowanie formularza", () => {
    it("powinien renderować formularz z jednym pustym wpisem, jeśli brak danych", () => {
      render(<WorkExpForm onNext={mockOnNext} onBack={mockOnBack} />);

      expect(screen.getByText("Work Experience")).toBeInTheDocument();
      expect(screen.getByText("Experience #1")).toBeInTheDocument();

      expect(screen.getByPlaceholderText("e.g. Acme Corp")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g. Software Engineer"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Describe your responsibilities/i),
      ).toBeInTheDocument();
    });

    it("powinien ładować i poprawnie formatować dane początkowe z kontekstu", () => {
      (useWizard as jest.Mock).mockReturnValue({
        updateWorkExperience: mockUpdateWorkExperience,
        wizardData: {
          workExperience: [
            {
              companyName: "Tech Corp",
              position: "Frontend Developer",
              beginDate: "2020-01-01T00:00:00Z",
              endDate: "2022-01-01T00:00:00Z",
              description: "Tworzenie interfejsów w React",
            },
          ],
        },
      });

      render(<WorkExpForm onNext={mockOnNext} onBack={mockOnBack} />);

      expect(screen.getByPlaceholderText("e.g. Acme Corp")).toHaveValue(
        "Tech Corp",
      );
      expect(screen.getByPlaceholderText("e.g. Software Engineer")).toHaveValue(
        "Frontend Developer",
      );
      expect(
        screen.getByPlaceholderText(/Describe your responsibilities/i),
      ).toHaveValue("Tworzenie interfejsów w React");

      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs[0]).toHaveValue("2020-01-01");
      expect(dateInputs[1]).toHaveValue("2022-01-01");
    });

    it("powinien umożliwić nawigację wstecz", () => {
      render(<WorkExpForm onNext={mockOnNext} onBack={mockOnBack} />);

      fireEvent.click(screen.getByRole("button", { name: /Back/i }));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("Zarządzanie listą (FieldArray)", () => {
    it("powinien pozwolić dodać kolejny wpis o doświadczeniu", () => {
      render(<WorkExpForm onNext={mockOnNext} onBack={mockOnBack} />);

      fireEvent.click(
        screen.getByRole("button", { name: /Add another experience entry/i }),
      );

      expect(screen.getByText("Experience #1")).toBeInTheDocument();
      expect(screen.getByText("Experience #2")).toBeInTheDocument();
    });

    it("powinien pozwolić usunąć wpis", async () => {
      (useWizard as jest.Mock).mockReturnValue({
        updateWorkExperience: mockUpdateWorkExperience,
        wizardData: {
          workExperience: [
            {
              companyName: "Firma A",
              position: "Dev",
              beginDate: "2020-01-01",
              description: "Opis A",
            },
            {
              companyName: "Firma B",
              position: "Dev",
              beginDate: "2021-01-01",
              description: "Opis B",
            },
          ],
        },
      });

      render(<WorkExpForm onNext={mockOnNext} onBack={mockOnBack} />);

      const removeButtons = screen.getAllByRole("button", {
        name: /Remove experience/i,
      });
      expect(removeButtons).toHaveLength(2);

      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByDisplayValue("Firma A")).not.toBeInTheDocument();
        expect(screen.getByDisplayValue("Firma B")).toBeInTheDocument();
      });
    });
  });

  describe("Walidacja i przesyłanie (Submit)", () => {
    it("powinien pokazać błędy, jeśli wysłano puste wymagane pola", async () => {
      render(<WorkExpForm onNext={mockOnNext} onBack={mockOnBack} />);

      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Company name is required"),
        ).toBeInTheDocument();
        expect(screen.getByText("Position is required")).toBeInTheDocument();
        expect(screen.getByText("Start date is required")).toBeInTheDocument();
        expect(
          screen.getByText("Job description is required"),
        ).toBeInTheDocument();
      });

      expect(mockUpdateWorkExperience).not.toHaveBeenCalled();
    });

    it("powinien zablokować datę początkową z przyszłości", async () => {
      render(<WorkExpForm onNext={mockOnNext} onBack={mockOnBack} />);

      const beginDateInput = document.querySelectorAll('input[type="date"]')[0];

      fireEvent.change(beginDateInput, { target: { value: "2050-01-01" } });

      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Date cannot be in the future"),
        ).toBeInTheDocument();
      });
    });

    it("powinien zablokować datę końcową, jeśli jest przed datą początkową", async () => {
      render(<WorkExpForm onNext={mockOnNext} onBack={mockOnBack} />);

      const beginDateInput = document.querySelectorAll('input[type="date"]')[0];
      const endDateInput = document.querySelectorAll('input[type="date"]')[1];

      fireEvent.change(beginDateInput, { target: { value: "2022-01-01" } });
      fireEvent.change(endDateInput, { target: { value: "2020-01-01" } });

      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("End date must be after the start date"),
        ).toBeInTheDocument();
      });
    });

    it("powinien poprawnie zwalidować, sformatować i zapisać dane", async () => {
      render(<WorkExpForm onNext={mockOnNext} onBack={mockOnBack} />);

      const companyInput = screen.getByPlaceholderText("e.g. Acme Corp");
      const positionInput = screen.getByPlaceholderText(
        "e.g. Software Engineer",
      );
      const beginDateInput = document.querySelectorAll('input[type="date"]')[0];
      const endDateInput = document.querySelectorAll('input[type="date"]')[1];
      const descInput = screen.getByPlaceholderText(
        /Describe your responsibilities/i,
      );

      fireEvent.change(companyInput, { target: { value: "Google" } });
      fireEvent.change(positionInput, { target: { value: "Senior Dev" } });
      fireEvent.change(beginDateInput, { target: { value: "2018-05-01" } });
      fireEvent.change(endDateInput, { target: { value: "2023-08-01" } });
      fireEvent.change(descInput, {
        target: { value: "Pisanie super kodu i testów" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(mockUpdateWorkExperience).toHaveBeenCalledTimes(1);

        const submittedData = mockUpdateWorkExperience.mock.calls[0][0];
        expect(submittedData).toHaveLength(1);
        expect(submittedData[0].companyName).toBe("Google");
        expect(submittedData[0].position).toBe("Senior Dev");
        expect(submittedData[0].description).toBe(
          "Pisanie super kodu i testów",
        );

        expect(submittedData[0].beginDate).toContain("2018-05-01");
        expect(submittedData[0].endDate).toContain("2023-08-01");

        expect(mockOnNext).toHaveBeenCalledTimes(1);
      });
    });

    it("powinien poprawnie obsłużyć aktualną pracę (bez daty końcowej)", async () => {
      render(<WorkExpForm onNext={mockOnNext} onBack={mockOnBack} />);

      const companyInput = screen.getByPlaceholderText("e.g. Acme Corp");
      const positionInput = screen.getByPlaceholderText(
        "e.g. Software Engineer",
      );
      const beginDateInput = document.querySelectorAll('input[type="date"]')[0];
      const descInput = screen.getByPlaceholderText(
        /Describe your responsibilities/i,
      );

      fireEvent.change(companyInput, { target: { value: "Startup" } });
      fireEvent.change(positionInput, { target: { value: "CTO" } });
      fireEvent.change(beginDateInput, { target: { value: "2023-01-01" } });
      fireEvent.change(descInput, {
        target: { value: "Zarządzanie zespołem i technologią" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(mockUpdateWorkExperience).toHaveBeenCalledTimes(1);
        const submittedData = mockUpdateWorkExperience.mock.calls[0][0];
        expect(submittedData[0].endDate).toBeUndefined();
        expect(mockOnNext).toHaveBeenCalledTimes(1);
      });
    });
  });
});
