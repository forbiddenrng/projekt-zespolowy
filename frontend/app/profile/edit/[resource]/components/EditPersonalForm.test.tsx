import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import EditPersonalForm from "./EditPersonalForm";
import axios from "axios";
import { useRouter } from "next/navigation";

jest.mock("axios");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../../../../app/profile/create/components/UserForm", () => {
  const Yup = require("yup");
  return {
    userValidator: Yup.object({
      name: Yup.string().required("First name is required"),
      surname: Yup.string().required("Last name is required"),
      phoneNum: Yup.string().required("Phone number is required"),
      city: Yup.string().required("City is required"),
    }),
  };
});

describe("EditPersonalForm Component", () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Pobieranie danych (GET) i renderowanie", () => {
    it("powinien wyświetlić stan ładowania na początku", async () => {
      let resolvePromise: any;
      (axios.get as jest.Mock).mockReturnValue(
        new Promise((res) => {
          resolvePromise = res;
        }),
      );

      render(<EditPersonalForm />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await act(async () => {
        resolvePromise({ data: { statusCode: 200, data: {} } });
      });
    });

    it("powinien wyświetlić błąd, jeśli zapytanie GET zakończy się błędem statusu", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { statusCode: 500 },
      });

      render(<EditPersonalForm />);

      await waitFor(() => {
        expect(screen.getByText("Failed to fetch data")).toBeInTheDocument();
      });
    });

    it("powinien wyświetlić błąd sieci (Exception), jeśli zapytanie rzuci błąd", async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error("Network Error"));

      render(<EditPersonalForm />);

      await waitFor(() => {
        expect(screen.getByText("Network Error")).toBeInTheDocument();
      });
    });

    it("powinien poprawnie załadować i zmapować dane usera z API", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          statusCode: 200,
          data: {
            name: "Jan",
            surname: "Kowalski",
            phone_number: "123456789",
            email: "jan@example.com",
            city: "Gdynia",
            profile_summary: "Doświadczony programista",
          },
        },
      });

      render(<EditPersonalForm />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText("First Name")).toHaveValue("Jan");
      expect(screen.getByLabelText("Last Name")).toHaveValue("Kowalski");
      expect(screen.getByLabelText("Phone Number")).toHaveValue("123456789");
      expect(screen.getByLabelText("Email")).toHaveValue("jan@example.com");
      expect(screen.getByLabelText("City")).toHaveValue("Gdynia");
      expect(screen.getByLabelText("Profile Summary")).toHaveValue(
        "Doświadczony programista",
      );

      expect(screen.getByLabelText("Email")).toBeDisabled();
    });

    it("powinien wyrenderować puste formularze, jeśli API nie zwróci części danych", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          statusCode: 200,
          data: {
            name: "Anna",
          },
        },
      });

      render(<EditPersonalForm />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText("First Name")).toHaveValue("Anna");
      expect(screen.getByLabelText("Last Name")).toHaveValue("");
      expect(screen.getByLabelText("Phone Number")).toHaveValue("");
    });
  });

  describe("Walidacja i aktualizacja (PATCH)", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          statusCode: 200,
          data: {
            name: "Jan",
            surname: "Kowalski",
            phone_number: "111222333",
            email: "test@test.pl",
            city: "Warszawa",
          },
        },
      });
      jest.useFakeTimers();
    });

    it("powinien zablokować zapis i pokazać błędy walidacji, gdy wyczyszczono wymagane pola", async () => {
      render(<EditPersonalForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      fireEvent.change(screen.getByLabelText("First Name"), {
        target: { value: "" },
      });
      fireEvent.change(screen.getByLabelText("Last Name"), {
        target: { value: "" },
      });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("First name is required")).toBeInTheDocument();
        expect(screen.getByText("Last name is required")).toBeInTheDocument();
      });

      expect(axios.patch).not.toHaveBeenCalled();
    });

    it("powinien pokazać błąd zapisu, jeśli axios.patch zwróci błąd statusu (!= 200)", async () => {
      render(<EditPersonalForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      (axios.patch as jest.Mock).mockResolvedValue({
        data: { statusCode: 500 },
      });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("An error occurred while saving data"),
        ).toBeInTheDocument();
      });
    });

    it("powinien poprawnie wysłać żądanie PATCH z wprowadzonymi danymi i przekierować po sukcesie", async () => {
      (axios.patch as jest.Mock).mockResolvedValue({
        data: { statusCode: 200 },
      });

      render(<EditPersonalForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      fireEvent.change(screen.getByLabelText("City"), {
        target: { value: "Sopot" },
      });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledTimes(1);
        expect(axios.patch).toHaveBeenCalledWith(
          "/api/user/profile?resource=personal",
          {
            name: "Jan",
            surname: "Kowalski",
            phoneNumber: "111222333",
            city: "Sopot",
            profileSummary: null,
          },
          { headers: { "Content-Type": "application/json" } },
        );

        expect(
          screen.getByText("Personal data updated successfully!"),
        ).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      expect(mockPush).toHaveBeenCalledWith("/profile");
    });
  });

  describe("Nawigacja wstecz", () => {
    it("powinien cofnąć użytkownika (router.back) po wciśnięciu Cancel", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { statusCode: 200, data: {} },
      });
      render(<EditPersonalForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
