import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import EditEducationForm from "./EditEducationForm";
import axios from "axios";
import { useRouter } from "next/navigation";

jest.mock("axios");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../../../../app/profile/create/components/UserEducation", () => {
  const yup = require("yup");
  return {
    emptyEducation: {
      schoolName: "",
      major: "",
      degree: "",
      beginDate: "",
      endDate: "",
    },
    formatDateForInput: (dateStr: string) => {
      if (!dateStr) return "";
      return new Date(dateStr).toISOString().split("T")[0];
    },
    degreeOptions: [
      { value: "", label: "Select degree" },
      { value: "bachelor", label: "Bachelor's Degree" },
      { value: "master", label: "Master's Degree" },
    ],
    educationFormValidator: yup.object({
      education: yup.array().of(
        yup.object({
          schoolName: yup.string().required("School name is required"),
          major: yup.string().required("Major is required"),
          degree: yup.string().required("Degree is required"),
        }),
      ),
    }),
  };
});

jest.mock("react-icons/fa", () => ({
  FaTrash: () => <svg data-testid="trash-icon" />,
}));

describe("EditEducationForm Component", () => {
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

      render(<EditEducationForm />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await act(async () => {
        resolvePromise({ data: { data: { education: [] } } });
      });
    });

    it("powinien wyświetlić błąd, jeśli zapytanie GET się nie powiedzie", async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error("Network Error"));

      render(<EditEducationForm />);

      await waitFor(() => {
        expect(
          screen.getByText("Error loading education data"),
        ).toBeInTheDocument();
      });
    });

    it("powinien wczytać i sformatować dane z API", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            education: [
              {
                id: 1,
                school_name: "Test University",
                major: "Computer Science",
                degree: "bachelor",
                begin_date: "2018-10-01T00:00:00Z",
                end_date: "2022-06-30T00:00:00Z",
              },
            ],
          },
        },
      });

      render(<EditEducationForm />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(
        screen.getByPlaceholderText(/e.g. Warsaw University of Technology/i),
      ).toHaveValue("Test University");
      expect(screen.getByPlaceholderText(/e.g. Computer Science/i)).toHaveValue(
        "Computer Science",
      );
      expect(
        screen.getByRole("combobox", { name: /Degree \/ Title/i }),
      ).toHaveValue("bachelor");

      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs[0]).toHaveValue("2018-10-01");
      expect(dateInputs[1]).toHaveValue("2022-06-30");
    });

    it("powinien wyrenderować puste pole, jeśli z API nie wrócą żadne dane", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: null },
      });

      render(<EditEducationForm />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Education #1")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/e.g. Warsaw University of Technology/i),
      ).toHaveValue("");
    });
  });

  describe("Zarządzanie formularzem (FieldArray)", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            education: [
              {
                id: 1,
                school_name: "Uni 1",
                major: "Maj 1",
                degree: "bachelor",
                begin_date: "2020-01-01T00:00:00Z",
              },
            ],
          },
        },
      });
    });

    it("powinien dodać nowe pole po kliknięciu przycisku dodawania", async () => {
      render(<EditEducationForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const addButton = screen.getByRole("button", {
        name: /Add another education entry/i,
      });
      fireEvent.click(addButton);

      expect(screen.getByText("Education #1")).toBeInTheDocument();
      expect(screen.getByText("Education #2")).toBeInTheDocument();
    });

    it("powinien usunąć wpis po kliknięciu ikony usuwania", async () => {
      render(<EditEducationForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const addButton = screen.getByRole("button", {
        name: /Add another education entry/i,
      });
      fireEvent.click(addButton);

      const removeButtons = screen.getAllByTitle("Remove education");
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText(
          /e.g. Warsaw University of Technology/i,
        );
        expect(inputs).toHaveLength(1);
        expect(inputs[0]).toHaveValue("");
      });
    });
  });

  describe("Przesyłanie i aktualizacja danych", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            education: [
              {
                id: 1,
                school_name: "Szkoła 1",
                major: "Infa",
                degree: "bachelor",
                begin_date: "2018-01-01T00:00:00Z",
              },
            ],
          },
        },
      });
      jest.useFakeTimers();
    });

    it("powinien zgłosić błąd zapisu po odpowiedzi axiosa", async () => {
      render(<EditEducationForm />);
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

    it("powinien poprawnie sformatować daty do ISO String i wysłać do serwera", async () => {
      (axios.put as jest.Mock).mockResolvedValue({ data: { statusCode: 200 } });

      render(<EditEducationForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const dates = document.querySelectorAll('input[type="date"]');

      fireEvent.change(dates[0], { target: { value: "2019-05-15" } });
      fireEvent.change(dates[1], { target: { value: "2023-06-20" } });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledTimes(1);

        const payloadArgs = (axios.put as jest.Mock).mock.calls[0][1].education;
        expect(payloadArgs).toHaveLength(1);

        expect(payloadArgs[0].beginDate).toContain("2019-05-15");
        expect(payloadArgs[0].endDate).toContain("2023-06-20");

        expect(
          screen.getByText("Education updated successfully!"),
        ).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      expect(mockPush).toHaveBeenCalledWith("/profile");
    });

    it("powinien zignorować endDate przed zapisem, jeśli pole pozostało puste", async () => {
      (axios.put as jest.Mock).mockResolvedValue({ data: { statusCode: 200 } });

      render(<EditEducationForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        const payloadArgs = (axios.put as jest.Mock).mock.calls[0][1].education;
        expect(payloadArgs[0].endDate).toBeUndefined();
      });
    });
  });

  describe("Nawigacja wstecz", () => {
    it("powinien cofnąć użytkownika po wciśnięciu Cancel", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { data: null } });
      render(<EditEducationForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
