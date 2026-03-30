import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import EditLinksForm from "./EditLinksForm";
import axios from "axios";
import { useRouter } from "next/navigation";

jest.mock("axios");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../../../../app/profile/create/components/UserLink", () => {
  const Yup = require("yup");
  return {
    emptyLinks: { linkString: "" },
    linksFormValidator: Yup.object({
      links: Yup.array().of(
        Yup.object({
          linkString: Yup.string()
            .required("Link is required")
            .url("Please enter a valid URL (e.g., https://...)"),
        }),
      ),
    }),
  };
});

// Mockujemy ikonę kosza
jest.mock("react-icons/fa", () => ({
  FaTrash: () => <svg data-testid="trash-icon" />,
}));

describe("EditLinksForm Component", () => {
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

  describe("Pobieranie i renderowanie danych z API", () => {
    it("powinien wyświetlić stan ładowania na samym początku", async () => {
      let resolvePromise: any;
      (axios.get as jest.Mock).mockReturnValue(
        new Promise((res) => {
          resolvePromise = res;
        }),
      );

      render(<EditLinksForm />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await act(async () => {
        resolvePromise({ data: { data: { links: [] } } });
      });
    });

    it("powinien wyświetlić komunikat o błędzie, jeśli pobieranie danych się nie powiedzie", async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error("Network Error"));

      render(<EditLinksForm />);

      await waitFor(() => {
        expect(screen.getByText("Error loading link data")).toBeInTheDocument();
      });
    });

    it("powinien wczytać i wyrenderować linki z API", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            links: [
              { id: 1, linkString: "https://github.com/jankowalski" },
              { id: 2, linkString: "https://linkedin.com/in/jankowalski" },
            ],
          },
        },
      });

      render(<EditLinksForm />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Edit Links")).toBeInTheDocument();

      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(2);
      expect(inputs[0]).toHaveValue("https://github.com/jankowalski");
      expect(inputs[1]).toHaveValue("https://linkedin.com/in/jankowalski");
    });

    it("powinien wyrenderować informację o braku linków, jeśli API nic nie zwróci", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: null },
      });

      render(<EditLinksForm />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(screen.getByText(/No links added yet/i)).toBeInTheDocument();
    });
  });

  describe("Operacje na formularzu (FieldArray)", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: { links: [{ id: 1, linkString: "https://test.com" }] } },
      });
    });

    it("powinien dodać nowe pole po kliknięciu przycisku 'Add another link'", async () => {
      render(<EditLinksForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const addButton = screen.getByRole("button", {
        name: /Add another link/i,
      });
      fireEvent.click(addButton);

      expect(screen.getAllByRole("textbox")).toHaveLength(2);
      expect(screen.getByText("Link #1")).toBeInTheDocument();
      expect(screen.getByText("Link #2")).toBeInTheDocument();
    });

    it("powinien usunąć pole po kliknięciu ikony kosza", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            links: [
              { linkString: "https://site1.com" },
              { linkString: "https://site2.com" },
            ],
          },
        },
      });

      render(<EditLinksForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      expect(screen.getAllByRole("textbox")).toHaveLength(2);

      const removeButtons = screen.getAllByTitle("Remove link");
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox");
        expect(inputs).toHaveLength(1);
        expect(inputs[0]).toHaveValue("https://site2.com");
      });
    });
  });

  describe("Walidacja i zapis danych (Submit)", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: { links: [{ id: 1, linkString: "https://mojastrona.pl" }] },
        },
      });
      jest.useFakeTimers();
    });

    it("powinien pokazać błąd z backendu, jeśli zapis się nie powiedzie", async () => {
      render(<EditLinksForm />);
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

    it("powinien zablokować zapis, jeśli podano nieprawidłowy URL (walidacja yup)", async () => {
      render(<EditLinksForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "to-nie-jest-link" } });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Please enter a valid URL (e.g., https://...)"),
        ).toBeInTheDocument();
      });

      expect(axios.put).not.toHaveBeenCalled();
    });

    it("powinien zapisać poprawne dane, pokazać komunikat sukcesu i przekierować usera", async () => {
      (axios.put as jest.Mock).mockResolvedValue({ data: { statusCode: 200 } });

      render(<EditLinksForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, {
        target: { value: "https://zaktualizowany-link.pl" },
      });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Sprawdzamy, czy payload jest odpowiednio sformatowany
        expect(axios.put).toHaveBeenCalledWith(
          "/api/user/profile?resource=links",
          { links: [{ id: 1, linkString: "https://zaktualizowany-link.pl" }] },
          { headers: { "Content-Type": "application/json" } },
        );

        expect(
          screen.getByText("Links updated successfully!"),
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
    it("powinien wywołać router.back() po kliknięciu Cancel", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { data: null } });
      render(<EditLinksForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
