import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserForm from "./UserForm";
import { useWizard } from "../context/WizardContext";

jest.mock("../context/WizardContext", () => ({
  useWizard: jest.fn(),
}));

describe("UserForm Component", () => {
  const mockOnNext = jest.fn();
  const mockUpdateUserInfo = jest.fn();

  const authUser = {
    sub: "auth0|123",
    name: "Jan Kowalski",
    given_name: "Jan",
    family_name: "Kowalski",
    email: "jan.kowalski@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useWizard as jest.Mock).mockReturnValue({
      updateUserInfo: mockUpdateUserInfo,
      wizardData: { userInfo: null },
    });
  });

  describe("Renderowanie i ładowanie początkowych danych", () => {
    it("powinien wyrenderować wszystkie pola formularza z odpowiednimi etykietami", () => {
      render(<UserForm user={authUser} onNext={mockOnNext} />);
      expect(screen.getByText("Personal Data")).toBeInTheDocument();
      expect(screen.getByLabelText("First Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Phone Number")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("City")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Profile Summary / Professional Description"),
      ).toBeInTheDocument();
    });

    it("powinien załadować dane z obiektu user (Auth), jeśli w wizardData nie ma jeszcze informacji", () => {
      render(<UserForm user={authUser} onNext={mockOnNext} />);
      expect(screen.getByLabelText("First Name")).toHaveValue("Jan Kowalski");
      expect(screen.getByLabelText("Last Name")).toHaveValue("Kowalski");
      expect(screen.getByLabelText("Email")).toHaveValue(
        "jan.kowalski@example.com",
      );
      expect(screen.getByLabelText("Phone Number")).toHaveValue("");
      expect(screen.getByLabelText("City")).toHaveValue("");
    });

    it("powinien priorytetyzować dane z wizardData ponad dane z obiektu user, jeśli takie istnieją", () => {
      (useWizard as jest.Mock).mockReturnValue({
        updateUserInfo: mockUpdateUserInfo,
        wizardData: {
          userInfo: {
            name: "Zmienione Imię",
            surname: "Zmienione Nazwisko",
            phoneNum: "111222333",
            email: "zmieniony@test.com",
            city: "Warszawa",
            profileSummary: "Moje doświadczenie",
          },
        },
      });

      render(<UserForm user={authUser} onNext={mockOnNext} />);

      expect(screen.getByLabelText("First Name")).toHaveValue("Zmienione Imię");
      expect(screen.getByLabelText("Last Name")).toHaveValue(
        "Zmienione Nazwisko",
      );
      expect(screen.getByLabelText("Email")).toHaveValue("zmieniony@test.com");
      expect(screen.getByLabelText("Phone Number")).toHaveValue("111222333");
      expect(screen.getByLabelText("City")).toHaveValue("Warszawa");
      expect(
        screen.getByLabelText("Profile Summary / Professional Description"),
      ).toHaveValue("Moje doświadczenie");
    });
  });

  describe("Walidacja formularza", () => {
    it("powinien pokazać błędy walidacji dla wymaganych pól, jeśli podjęto próbę wysłania pustych danych", async () => {
      render(<UserForm user={{ sub: "123" }} onNext={mockOnNext} />);

      const nextButton = screen.getByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText("First name is required")).toBeInTheDocument();
        expect(screen.getByText("Last name is required")).toBeInTheDocument();
        expect(
          screen.getByText("Phone number is required"),
        ).toBeInTheDocument();
        expect(screen.getByText("Email is required")).toBeInTheDocument();
        expect(screen.getByText("City is required")).toBeInTheDocument();
      });

      expect(mockUpdateUserInfo).not.toHaveBeenCalled();
      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it("powinien poprawnie zwalidować minimalną długość podsumowania profilu", async () => {
      render(<UserForm user={authUser} onNext={mockOnNext} />);

      const summaryInput = screen.getByLabelText(
        "Profile Summary / Professional Description",
      );
      fireEvent.change(summaryInput, { target: { value: "Za krótki tekst" } });

      const nextButton = screen.getByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText("Profile summary must be at least 20 characters"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Akcje użytkownika", () => {
    it("powinien zapisać zwalidowane dane do globalnego stanu (updateUserInfo) i przejść dalej", async () => {
      render(<UserForm user={authUser} onNext={mockOnNext} />);
      const phoneInput = screen.getByLabelText("Phone Number");
      const cityInput = screen.getByLabelText("City");

      fireEvent.change(phoneInput, { target: { value: "+48 123 456 789" } });
      fireEvent.change(cityInput, { target: { value: "Gdynia" } });

      const nextButton = screen.getByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockUpdateUserInfo).toHaveBeenCalledTimes(1);

        const submittedData = mockUpdateUserInfo.mock.calls[0][0];
        expect(submittedData.name).toBe("Jan Kowalski");
        expect(submittedData.surname).toBe("Kowalski");
        expect(submittedData.email).toBe("jan.kowalski@example.com");
        expect(submittedData.phoneNum).toBe("+48 123 456 789");
        expect(submittedData.city).toBe("Gdynia");
        expect(mockOnNext).toHaveBeenCalledTimes(1);
      });
    });

    it("powinien zresetować formularz do domyślnych wartości po kliknięciu 'Reset'", async () => {
      (useWizard as jest.Mock).mockReturnValue({
        updateUserInfo: mockUpdateUserInfo,
        wizardData: {
          userInfo: {
            name: "Zapisane Imię",
            surname: "Zapisane Nazwisko",
            phoneNum: "123123123",
            email: "test@test.pl",
            city: "Sopot",
            profileSummary:
              "Testowe podsumowanie, które ma minimum dwadzieścia znaków",
          },
        },
      });

      render(<UserForm user={authUser} onNext={mockOnNext} />);
      expect(screen.getByLabelText("City")).toHaveValue("Sopot");

      const resetButton = screen.getByRole("button", { name: /Reset/i });
      fireEvent.click(resetButton);
      await waitFor(() => {
        expect(screen.getByLabelText("City")).toHaveValue("");
        expect(screen.getByLabelText("First Name")).toHaveValue("");
        expect(screen.getByLabelText("Phone Number")).toHaveValue("");
      });
    });
  });
});
