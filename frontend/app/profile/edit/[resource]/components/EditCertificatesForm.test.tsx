import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import EditCertificatesForm from "./EditCertificatesForm";
import axios from "axios";
import { useRouter } from "next/navigation";

jest.mock("axios");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock(
  "../../../../../app/profile/create/components/UserCertificates",
  () => {
    const yup = require("yup");
    return {
      emptyCertificates: { name: "", issuer: "", certificationDate: "" },
      formatDateForInput: (dateStr: string) => {
        if (!dateStr) return "";
        return new Date(dateStr).toISOString().split("T")[0];
      },
      certificatesFormValidator: yup.object({
        certificates: yup.array().of(
          yup.object({
            name: yup.string().required("Name is required"),
            issuer: yup.string().required("Issuer is required"),
          }),
        ),
      }),
    };
  },
);

jest.mock("react-icons/fa", () => ({
  FaTrash: () => <svg data-testid="trash-icon" />,
}));

describe("EditCertificatesForm Component", () => {
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

  describe("Pobieranie i renderowanie danych", () => {
    it("powinien wyświetlić stan ładowania na starcie", async () => {
      let resolvePromise: any;
      (axios.get as jest.Mock).mockReturnValue(
        new Promise((res) => {
          resolvePromise = res;
        }),
      );

      render(<EditCertificatesForm />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await act(async () => {
        resolvePromise({ data: { data: { certificates: [] } } });
      });
    });

    it("powinien wyświetlić błąd, jeśli zapytanie GET się nie powiedzie", async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error("Network Error"));

      render(<EditCertificatesForm />);

      await waitFor(() => {
        expect(screen.getByText("Error loading data")).toBeInTheDocument();
      });
    });

    it("powinien poprawnie wczytać i sformatować dane z API", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            certificates: [
              {
                id: 1,
                name: "AWS Certified",
                issuer: "Amazon",
                certification_date: "2024-01-15T00:00:00.000Z",
              },
            ],
          },
        },
      });

      render(<EditCertificatesForm />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(
        screen.getByPlaceholderText(/e.g. AWS Certified Developer/i),
      ).toHaveValue("AWS Certified");
      expect(
        screen.getByPlaceholderText(/e.g. Amazon Web Services/i),
      ).toHaveValue("Amazon");

      const dateInput = document.querySelector('input[type="date"]');
      expect(dateInput).toHaveValue("2024-01-15");
    });

    it("powinien wyświetlić puste pole z informacją, jeśli nie pobrano żadnych certyfikatów", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: null },
      });

      render(<EditCertificatesForm />);

      await waitFor(() => {
        expect(
          screen.getByText(/No certificates added yet/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Zarządzanie formularzem (FieldArray)", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            certificates: [
              {
                id: 1,
                name: "Google Cloud",
                issuer: "Google",
                certification_date: "2020-01-01T00:00:00Z",
              },
            ],
          },
        },
      });
    });

    it("powinien dodać nowe pole po kliknięciu przycisku 'Add another certificate'", async () => {
      render(<EditCertificatesForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const addButton = screen.getByRole("button", {
        name: /Add another certificate/i,
      });
      fireEvent.click(addButton);

      expect(screen.getByText("Certificate #1")).toBeInTheDocument();
      expect(screen.getByText("Certificate #2")).toBeInTheDocument();
    });

    it("powinien usunąć wpis po kliknięciu ikony usuwania", async () => {
      render(<EditCertificatesForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const removeButton = screen.getByTitle("Remove certificate");
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText("Certificate #1")).not.toBeInTheDocument();
        expect(
          screen.getByText(/No certificates added yet/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Przesyłanie i aktualizacja danych", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            certificates: [
              {
                id: 1,
                name: "Certyfikat A",
                issuer: "Firma A",
                certification_date: "2023-01-01T00:00:00Z",
              },
            ],
          },
        },
      });
      jest.useFakeTimers();
    });

    it("powinien zgłosić błąd zapisu z użyciem axios.put", async () => {
      render(<EditCertificatesForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      (axios.put as jest.Mock).mockRejectedValue(new Error("Server error"));

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("An error occurred while saving data"),
        ).toBeInTheDocument();
      });
    });

    it("powinien prawidłowo sformatować dane i zapisać wypełnione wpisy", async () => {
      (axios.put as jest.Mock).mockResolvedValue({ data: { statusCode: 200 } });

      render(<EditCertificatesForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const addButton = screen.getByRole("button", {
        name: /Add another certificate/i,
      });
      fireEvent.click(addButton);

      const names = screen.getAllByPlaceholderText(
        /e.g. AWS Certified Developer/i,
      );
      const issuers = screen.getAllByPlaceholderText(
        /e.g. Amazon Web Services/i,
      );
      const dates = document.querySelectorAll('input[type="date"]');
      fireEvent.change(names[1], { target: { value: "Nowy Certyfikat" } });
      fireEvent.change(issuers[1], { target: { value: "Nowy Wydawca" } });
      fireEvent.change(dates[1], { target: { value: "2024-05-10" } });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledTimes(1);

        const payloadArgs = (axios.put as jest.Mock).mock.calls[0][1]
          .certificates;

        expect(payloadArgs).toHaveLength(2);
        expect(payloadArgs[0].name).toBe("Certyfikat A");
        expect(payloadArgs[1].name).toBe("Nowy Certyfikat");
        expect(payloadArgs[1].certificationDate).toContain("2024-05-10");

        expect(
          screen.getByText("Certificates updated successfully!"),
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
      (axios.get as jest.Mock).mockResolvedValue({ data: { data: null } });
      render(<EditCertificatesForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
