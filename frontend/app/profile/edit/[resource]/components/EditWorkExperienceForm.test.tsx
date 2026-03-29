import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import EditWorkExperienceForm from "./EditWorkExperienceForm";
import axios from "axios";
import { useRouter } from "next/navigation";

jest.mock("axios");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock(
  "../../../../../app/profile/create/components/UserWorkExperience",
  () => {
    const Yup = require("yup");
    return {
      emptyWorkExp: {
        companyName: "",
        position: "",
        beginDate: "",
        endDate: "",
        description: "",
      },
      formatDateForInput: (dateStr: string) => {
        if (!dateStr) return "";
        return new Date(dateStr).toISOString().split("T")[0];
      },
      workExpFormValidator: Yup.object({
        workExp: Yup.array().of(
          Yup.object({
            companyName: Yup.string().required("Company name is required"),
            position: Yup.string().required("Position is required"),
            beginDate: Yup.date().required("Start date is required"),
          }),
        ),
      }),
    };
  },
);

jest.mock("react-icons/fa", () => ({
  FaTrash: () => <svg data-testid="trash-icon" />,
}));

describe("EditWorkExperienceForm Component", () => {
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

  describe("Inicjalizacja i renderowanie danych", () => {
    it("powinien wyświetlić stan ładowania zanim dane z API zostaną pobrane", async () => {
      let resolvePromise: any;
      (axios.get as jest.Mock).mockReturnValue(
        new Promise((res) => {
          resolvePromise = res;
        }),
      );

      render(<EditWorkExperienceForm />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await act(async () => {
        resolvePromise({ data: { data: { work_experiences: [] } } });
      });
    });

    it("powinien wyświetlić komunikat błędu, jeśli nie uda się pobrać danych (GET)", async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error("Network Error"));

      render(<EditWorkExperienceForm />);

      await waitFor(() => {
        expect(
          screen.getByText("Error loading work experience data"),
        ).toBeInTheDocument();
      });
    });

    it("powinien wczytać, sformatować i wyrenderować dane zawodowe zwrócone z API", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            work_experiences: [
              {
                id: 1,
                company_name: "Tech Corp",
                position: "Senior Developer",
                begin_date: "2019-03-01T00:00:00.000Z",
                end_date: "2023-08-31T00:00:00.000Z",
                description: "Zarządzanie zespołem i kodowanie",
              },
            ],
          },
        },
      });

      render(<EditWorkExperienceForm />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText(/e.g. ABC Inc./i)).toHaveValue(
        "Tech Corp",
      );
      expect(
        screen.getByPlaceholderText(/e.g. Software Engineer/i),
      ).toHaveValue("Senior Developer");
      expect(
        screen.getByPlaceholderText(
          /Describe your responsibilities and achievements/i,
        ),
      ).toHaveValue("Zarządzanie zespołem i kodowanie");

      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs[0]).toHaveValue("2019-03-01");
      expect(dateInputs[1]).toHaveValue("2023-08-31");
    });

    it("powinien wyrenderować puste pole formularza, jeśli użytkownik nie ma historii zatrudnienia", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: null },
      });

      render(<EditWorkExperienceForm />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText(/e.g. ABC Inc./i)).toHaveValue("");
    });
  });

  describe("Operacje na liście wpisów (FieldArray)", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            work_experiences: [
              {
                id: 1,
                company_name: "Firma A",
                position: "Dev",
                begin_date: "2020-01-01T00:00:00Z",
              },
            ],
          },
        },
      });
    });

    it("powinien umożliwić dodanie nowego doświadczenia zawodowego", async () => {
      render(<EditWorkExperienceForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const addButton = screen.getByRole("button", {
        name: /Add another experience/i,
      });
      fireEvent.click(addButton);

      expect(screen.getByText("Experience #1")).toBeInTheDocument();
      expect(screen.getByText("Experience #2")).toBeInTheDocument();

      const inputs = screen.getAllByPlaceholderText(/e.g. ABC Inc./i);
      expect(inputs).toHaveLength(2);
      expect(inputs[1]).toHaveValue("");
    });

    it("powinien umożliwić usunięcie doświadczenia z listy", async () => {
      render(<EditWorkExperienceForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const addButton = screen.getByRole("button", {
        name: /Add another experience/i,
      });
      fireEvent.click(addButton);

      const removeButtons = screen.getAllByTitle("Remove experience");
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText(/e.g. ABC Inc./i);
        expect(inputs).toHaveLength(1);
        expect(inputs[0]).toHaveValue("");
      });
    });
  });

  describe("Zapisywanie danych i walidacja (PUT)", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            work_experiences: [
              {
                id: 1,
                company_name: "Startup X",
                position: "CTO",
                begin_date: "2018-01-01T00:00:00Z",
              },
            ],
          },
        },
      });
      jest.useFakeTimers();
    });

    it("powinien obsłużyć błąd zapisu, jeśli wystąpi problem po stronie serwera", async () => {
      render(<EditWorkExperienceForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      (axios.put as jest.Mock).mockRejectedValue(new Error("Server Exception"));

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("An error occurred while saving data"),
        ).toBeInTheDocument();
      });
    });

    it("powinien wyświetlić błędy walidacji (Yup), jeśli usunięto wymagane dane", async () => {
      render(<EditWorkExperienceForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const companyInput = screen.getByPlaceholderText(/e.g. ABC Inc./i);
      fireEvent.change(companyInput, { target: { value: "" } });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Company name is required"),
        ).toBeInTheDocument();
      });

      expect(axios.put).not.toHaveBeenCalled();
    });

    it("powinien poprawnie sformatować zaktualizowane dane (daty do ISO) i wysłać je przez API", async () => {
      (axios.put as jest.Mock).mockResolvedValue({ data: { statusCode: 200 } });

      render(<EditWorkExperienceForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const companyInput = screen.getByPlaceholderText(/e.g. ABC Inc./i);
      const positionInput = screen.getByPlaceholderText(
        /e.g. Software Engineer/i,
      );
      const dates = document.querySelectorAll('input[type="date"]'); // 0 to Start, 1 to End

      fireEvent.change(companyInput, { target: { value: "Nowa Firma S.A." } });
      fireEvent.change(positionInput, { target: { value: "Dyrektor" } });

      fireEvent.change(dates[0], { target: { value: "2020-05-15" } });
      fireEvent.change(dates[1], { target: { value: "2024-01-10" } });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledTimes(1);

        const payloadArgs = (axios.put as jest.Mock).mock.calls[0][1]
          .workExperiences;
        expect(payloadArgs).toHaveLength(1);

        expect(payloadArgs[0].companyName).toBe("Nowa Firma S.A.");
        expect(payloadArgs[0].position).toBe("Dyrektor");
        expect(payloadArgs[0].beginDate).toContain("2020-05-15");
        expect(payloadArgs[0].endDate).toContain("2024-01-10");

        expect(
          screen.getByText("Work experience updated successfully!"),
        ).toBeInTheDocument();
      });
      expect(mockPush).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      expect(mockPush).toHaveBeenCalledWith("/profile");
    });

    it("powinien poprawnie zapisać wpis, gdy pominięto opcjonalną datę końcową", async () => {
      (axios.put as jest.Mock).mockResolvedValue({ data: { statusCode: 200 } });

      render(<EditWorkExperienceForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        const payloadArgs = (axios.put as jest.Mock).mock.calls[0][1]
          .workExperiences;
        expect(payloadArgs[0].endDate).toBeUndefined();
      });
    });
  });

  describe("Nawigacja wstecz", () => {
    it("powinien cofnąć użytkownika do poprzedniej strony po wciśnięciu Cancel", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { data: null } });
      render(<EditWorkExperienceForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
