import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import EditLanguagesForm from "./EditLanguagesForm";
import axios from "axios";
import { useRouter } from "next/navigation";

jest.mock("axios");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../../../../app/profile/create/components/UserLanguage", () => {
  const yup = require("yup");
  return {
    emptyUserLanguage: () => ({ languageId: null, level: "A1" }),
    languagesFormValidator: yup.object({
      languages: yup.array().of(
        yup.object({
          languageId: yup
            .number()
            .nullable()
            .required("Please select a language"),
          level: yup.string().required("Please select a level"),
        }),
      ),
    }),
  };
});

jest.mock("../../../../../app/ts/types", () => ({
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

jest.mock("react-icons/fa", () => ({
  FaTrash: () => <svg data-testid="trash-icon" />,
}));

describe("EditLanguagesForm Component", () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  const mockAllLanguages = [
    { id: 1, name: "English", code: "EN" },
    { id: 2, name: "Spanish", code: "ES" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });

    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/user/language/get")) {
        return Promise.resolve({ data: { data: mockAllLanguages } });
      }
      if (url.includes("/api/user/get?resource=languages")) {
        return Promise.resolve({ data: { data: null } });
      }
      return Promise.reject(new Error("Not found"));
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

      render(<EditLanguagesForm />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await act(async () => {
        resolvePromise({ data: { data: [] } });
      });
    });

    it("powinien wyświetlić błąd, jeśli zapytanie GET się nie powiedzie", async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error("Network Error"));

      render(<EditLanguagesForm />);

      await waitFor(() => {
        expect(
          screen.getByText("Error loading language data"),
        ).toBeInTheDocument();
      });
    });

    it("powinien wczytać listę wszystkich języków oraz języki użytkownika", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/user/language/get")) {
          return Promise.resolve({ data: { data: mockAllLanguages } });
        }
        if (url.includes("/api/user/get?resource=languages")) {
          return Promise.resolve({
            data: {
              data: {
                user_languages: [
                  {
                    id: 10,
                    language: { id: 1, name: "English", code: "EN" },
                    level: "B2",
                  },
                ],
              },
            },
          });
        }
        return Promise.reject(new Error("Not found"));
      });

      render(<EditLanguagesForm />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Language #1")).toBeInTheDocument();

      const selects = screen.getAllByRole("combobox");
      expect(selects).toHaveLength(2);

      expect(selects[0]).toHaveValue("1");
      expect(selects[1]).toHaveValue("B2");

      expect(screen.getByText("English (EN)")).toBeInTheDocument();
      expect(screen.getByText("Spanish (ES)")).toBeInTheDocument();
    });

    it("powinien wyświetlić puste pole z informacją, jeśli nie pobrano języków użytkownika", async () => {
      render(<EditLanguagesForm />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(screen.getByText(/No languages added yet/i)).toBeInTheDocument();
    });
  });

  describe("Zarządzanie formularzem (FieldArray)", () => {
    it("powinien dodać nowe pole po kliknięciu przycisku 'Add another language'", async () => {
      render(<EditLanguagesForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const addButton = screen.getByRole("button", {
        name: /Add another language/i,
      });
      fireEvent.click(addButton);

      expect(screen.getByText("Language #1")).toBeInTheDocument();
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
    });

    it("powinien usunąć wpis po kliknięciu ikony usuwania", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/user/language/get"))
          return Promise.resolve({ data: { data: mockAllLanguages } });
        if (url.includes("/api/user/get?resource=languages")) {
          return Promise.resolve({
            data: {
              data: {
                user_languages: [{ id: 1, language: { id: 1 }, level: "A1" }],
              },
            },
          });
        }
        return Promise.resolve({ data: {} });
      });

      render(<EditLanguagesForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const removeButton = screen.getByTitle("Remove language");
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText("Language #1")).not.toBeInTheDocument();
        expect(screen.getByText(/No languages added yet/i)).toBeInTheDocument();
      });
    });
  });

  describe("Przesyłanie i aktualizacja danych", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/user/language/get"))
          return Promise.resolve({ data: { data: mockAllLanguages } });
        if (url.includes("/api/user/get?resource=languages")) {
          return Promise.resolve({
            data: {
              data: {
                user_languages: [{ id: 99, language: { id: 1 }, level: "A1" }],
              },
            },
          });
        }
        return Promise.resolve({ data: {} });
      });
    });

    it("powinien zgłosić błąd zapisu po odpowiedzi axiosa", async () => {
      render(<EditLanguagesForm />);
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

    it("powinien zablokować zapis w przypadku braku wybranego języka", async () => {
      render(<EditLanguagesForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const addButton = screen.getByRole("button", {
        name: /Add another language/i,
      });
      fireEvent.click(addButton);

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Please select a language"),
        ).toBeInTheDocument();
      });

      expect(axios.put).not.toHaveBeenCalled();
    });

    it("powinien zapisać dane do API i przekierować po 1.5s", async () => {
      (axios.put as jest.Mock).mockResolvedValue({ data: { statusCode: 200 } });

      render(<EditLanguagesForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[1], { target: { value: "C1" } });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledTimes(1);

        const payloadArgs = (axios.put as jest.Mock).mock.calls[0][1].languages;
        expect(payloadArgs).toHaveLength(1);
        expect(payloadArgs[0].id).toBe(99);
        expect(payloadArgs[0].languageId).toBe(1);
        expect(payloadArgs[0].level).toBe("C1");

        expect(
          screen.getByText("Languages updated successfully!"),
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
    it("powinien cofnąć użytkownika po wciśnięciu Cancel", async () => {
      render(<EditLanguagesForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
