import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CertificatesForm, { formatDateForInput } from "./UserCertificates";
import { useWizard } from "../context/WizardContext";

jest.mock("../context/WizardContext", () => ({
  useWizard: jest.fn(),
}));

describe("CertificatesForm Component", () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();
  const mockUpdateCertificates = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useWizard as jest.Mock).mockReturnValue({
      updateCertificates: mockUpdateCertificates,
      wizardData: { certificates: [] },
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

  describe("Renderowanie i zachowanie interfejsu", () => {
    it("powinien rednerować informacje o tym, że krok jest opcjonalny", () => {
      render(<CertificatesForm onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText("Certificates")).toBeInTheDocument();
      expect(
        screen.getByText(/You haven't added any certificates yet/i),
      ).toBeInTheDocument();
    });

    it("powinien załadować początkowe certyfikaty z kontekstu, jeśli istnieją takowe", () => {
      (useWizard as jest.Mock).mockReturnValue({
        updateCertificates: mockUpdateCertificates,
        wizardData: {
          certificates: [
            {
              name: "AWS Certified",
              issuer: "Amazon",
              certificationDate: "2023-01-01T00:00:00.00Z",
            },
          ],
        },
      });

      render(<CertificatesForm onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText("Certificate #1")).toBeInTheDocument();

      const nameInputs = screen.getAllByPlaceholderText(
        /e.g. AWS Certified Developer/i,
      );
      const issuerInputs = screen.getAllByPlaceholderText(
        /e.g. Amazon Web Services/i,
      );

      expect(nameInputs[0]).toHaveValue("AWS Certified");
      expect(issuerInputs[0]).toHaveValue("Amazon");
    });

    it("powinien dodać nowy certyfikat po kliknięciu 'Add another certificate'", () => {
      render(<CertificatesForm onNext={mockOnNext} onBack={mockOnBack} />);

      const addButton = screen.getByRole("button", {
        name: /Add another certificate/i,
      });
      fireEvent.click(addButton);
      expect(screen.getByText("Certificate #1")).toBeInTheDocument();
      expect(
        screen.queryByText(/You haven't added any certificates yet/i),
      ).not.toBeInTheDocument();
    });

    it("powinien usunąc certyfikat po kliknięciu 'Remove certificate'", async () => {
      (useWizard as jest.Mock).mockReturnValue({
        updateCertificates: mockUpdateCertificates,
        wizardData: {
          certificates: [
            {
              name: "AWS Certified",
              issuer: "Amazon",
              certificationDate: "2023-01-01T00:00:00.00Z",
            },
          ],
        },
      });

      render(<CertificatesForm onNext={mockOnNext} onBack={mockOnBack} />);
      const deleteButton = screen.getByRole("button", {
        name: /Remove certificate/i,
      });
      fireEvent.click(deleteButton);
      await waitFor(() => {
        expect(screen.queryByText("Certificate #1")).not.toBeInTheDocument();
        expect(
          screen.queryByText(/You haven't added any certificates yet/i),
        ).toBeInTheDocument();
      });
    });

    it("powinien wywołać funkcję onBack po kliknięciu w przycisk 'Back'", () => {
      render(<CertificatesForm onNext={mockOnNext} onBack={mockOnBack} />);
      const backButton = screen.getByRole("button", { name: /Back/i });
      fireEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("Walidacja i przesyłanie (Submit)", () => {
    it("powinien przejść dalej od razu, jeśli użytkownik nie dodał żadnych certyfikatów", async () => {
      render(<CertificatesForm onNext={mockOnNext} onBack={mockOnBack} />);
      const nextButton = screen.getByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(mockUpdateCertificates).toHaveBeenCalledWith([]);
        expect(mockOnNext).toHaveBeenCalledTimes(1);
      });
    });

    it("powinien wyświetlać błędy walidacji, jeśli dodano certyfikat i zostawiono puste pola", async () => {
      render(<CertificatesForm onNext={mockOnNext} onBack={mockOnBack} />);
      const addButton = screen.getByRole("button", {
        name: /Add another certificate/i,
      });
      fireEvent.click(addButton);

      const nextButton = screen.getByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText("Certificate name is required"),
        ).toBeInTheDocument();
        expect(screen.getByText("Issuer is required")).toBeInTheDocument();
      });

      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it("powinien wyświetlać błąd, jeśli data wydania certyfikatu jest z przyszłości", async () => {
      render(<CertificatesForm onNext={mockOnNext} onBack={mockOnBack} />);
      const addButton = screen.getByRole("button", {
        name: /Add another certificate/i,
      });
      fireEvent.click(addButton);

      const nameInput = screen.getByPlaceholderText(
        /e.g. AWS Certified Developer/i,
      );
      const issuerInput = screen.getByPlaceholderText(
        /e.g. Amazon Web Services/i,
      );
      const dateInput =
        screen
          .getAllByRole("textbox")
          .find((el) => el.getAttribute("type") === "date") ||
        document.querySelector('input[type="date"]');

      fireEvent.change(nameInput, { target: { value: "Test Cert" } });
      fireEvent.change(issuerInput, { target: { value: "Test Issuer" } });
      fireEvent.change(dateInput!, { target: { value: "2099-01-01" } });

      const nextButton = screen.getByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText("Date cannot be in the future"),
        ).toBeInTheDocument();
      });

      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it("powinien poprawnie sformatować i wysłać dane do kontekstu po udanej walidacji", async () => {
      render(<CertificatesForm onNext={mockOnNext} onBack={mockOnBack} />);
      const addButton = screen.getByRole("button", {
        name: /Add another certificate/i,
      });
      fireEvent.click(addButton);

      const nameInput = screen.getByPlaceholderText(
        /e.g. AWS Certified Developer/i,
      );
      const issuerInput = screen.getByPlaceholderText(
        /e.g. Amazon Web Services/i,
      );
      const dateInput =
        screen
          .getAllByRole("textbox")
          .find((el) => el.getAttribute("type") === "date") ||
        document.querySelector('input[type="date"]');

      fireEvent.change(nameInput, {
        target: { value: "Google Cloud Architect" },
      });
      fireEvent.change(issuerInput, { target: { value: "Google" } });
      fireEvent.change(dateInput!, { target: { value: "2023-05-10" } });

      const nextButton = screen.getByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockUpdateCertificates).toHaveBeenCalledTimes(1);
        const submittedCertificates = mockUpdateCertificates.mock.calls[0][0];
        expect(submittedCertificates).toHaveLength(1);
        expect(submittedCertificates[0].name).toBe("Google Cloud Architect");
        expect(submittedCertificates[0].issuer).toBe("Google");
        expect(submittedCertificates[0].certificationDate).toContain(
          "2023-05-10",
        );

        expect(mockOnNext).toHaveBeenCalledTimes(1);
      });
    });
  });
});
