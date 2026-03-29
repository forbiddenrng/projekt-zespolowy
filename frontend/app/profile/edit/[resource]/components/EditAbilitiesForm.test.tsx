import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import EditAbilitiesForm from "./EditAbilitiesForm";
import axios from "axios";
import { useRouter } from "next/navigation";

jest.mock("axios");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../../../../app/profile/create/components/UserAbilities", () => {
  const yup = require("yup");
  return {
    emptyAbilities: { name: "" },
    abilitiesFormValidator: yup.object({
      abilities: yup.array().of(
        yup.object({
          name: yup.string().required("Skill name is required"),
        }),
      ),
    }),
  };
});

jest.mock("react-icons/fa", () => ({
  FaTrash: () => <svg data-testid="trash-icon" />,
}));

describe("EditAbilitiesForm Component", () => {
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

  describe("Pobieranie danych i renderowanie", () => {
    it("powinien wyświelić stan ładowania na starcie", async () => {
      let resolvePromise: any;
      (axios.get as jest.Mock).mockReturnValue(
        new Promise((res) => {
          resolvePromise = res;
        }),
      );

      render(<EditAbilitiesForm />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await act(async () => {
        resolvePromise({ data: { data: { abilities: [] } } });
      });
    });

    it("powinien wyświetlić błąd, jeśli pobieranie danych się nie powiedzie", async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error("Network Error"));
      render(<EditAbilitiesForm />);
      await waitFor(() => {
        expect(screen.getByText("Network Error")).toBeInTheDocument();
      });
    });

    it("powinien wyrenderować formularz z pobieranymi danymi", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            abilities: [
              { id: 1, name: "React" },
              { id: 2, name: "Node.js" },
            ],
          },
        },
      });

      render(<EditAbilitiesForm />);
      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Edit Skills")).toBeInTheDocument();
      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(2);
      expect(inputs[0]).toHaveValue("React");
      expect(inputs[1]).toHaveValue("Node.js");
    });

    it("powinien wyrenderować puste pole, jeśli API nie zwróci żadnych umiejętności", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: null },
      });

      render(<EditAbilitiesForm />);

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(1);
      expect(inputs[0]).toHaveValue("");
    });
  });

  describe("Zarządzanie listą (Filed Array)", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: { abilities: [{ id: 1, name: "Java" }] } },
      });
    });

    it("powinien dodać nowe pole po kliknięciu przycisku dodawania", async () => {
      render(<EditAbilitiesForm />);
      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      const addButton = screen.getByRole("button", {
        name: /Add another skill/i,
      });
      fireEvent.click(addButton);

      expect(screen.getAllByRole("textbox")).toHaveLength(2);
      expect(screen.getByText("Skill #1")).toBeInTheDocument();
      expect(screen.getByText("Skill #2")).toBeInTheDocument();
      expect(screen.queryByText("Skill #3")).not.toBeInTheDocument();
    });

    it("powinien usunąć pole po kliknięciu ikony kosza", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: { abilities: [{ name: "Java" }, { name: "C++" }] } },
      });

      render(<EditAbilitiesForm />);

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );

      expect(screen.getAllByRole("textbox")).toHaveLength(2);
      const removeButtons = screen.getAllByTitle("Remove skill");
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox");
        expect(inputs).toHaveLength(1);
        expect(inputs[0]).toHaveValue("C++");
      });
    });
  });

  describe("Walidacja i przesyłanie (Submit)", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: { abilities: [{ id: 1, name: "React" }] } },
      });
      jest.useFakeTimers();
    });

    it("powinien pokazać błąd zapisu, jeśli API zwróci błąd", async () => {
      render(<EditAbilitiesForm />);
      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      (axios.put as jest.Mock).mockRejectedValue(new Error("Server error"));

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(
          screen.getByText("An error occurred while saving data"),
        ).toBeInTheDocument();
      });
    });

    it("powinien pokazać błąd walidacji, jeśli pole jest puste", async () => {
      render(<EditAbilitiesForm />);
      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "" } });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Skill name is required")).toBeInTheDocument();
      });

      expect(axios.put).not.toHaveBeenCalled();
    });

    it("powinien zapisać dane, wyświetlić komunikat o skucesie i przekierować usera po upływie czasu", async () => {
      (axios.put as jest.Mock).mockResolvedValue({ data: { statusCode: 200 } });
      render(<EditAbilitiesForm />);
      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "React Native" } });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          "/api/user/profile?resource=abilities",
          { abilities: [{ id: 1, name: "React Native" }] },
          { headers: { "Content-Type": "application/json" } },
        );
        expect(
          screen.getByText("Skills updated successfully!"),
        ).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockPush).toHaveBeenCalledWith("/profile");
    });
  });

  describe("Nawigacja", () => {
    it("powinien wywołać router.back() po kliknięciu Cancel", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { data: null } });
      render(<EditAbilitiesForm />);
      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
