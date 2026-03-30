import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AbilitiesForm from "./UserAbilities";
import { useWizard } from "../context/WizardContext";

jest.mock("../context/WizardContext", () => ({
  useWizard: jest.fn(),
}));

describe("AbilitiesForm Component", () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();
  const mockUpdateAbilities = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useWizard as jest.Mock).mockReturnValue({
      updateAbilities: mockUpdateAbilities,
      wizardData: { abilities: [] },
    });
  });

  it("powinien renderować początkowy formualrz z jednym pustym polem, gdy brak danych w wizardData", () => {
    render(<AbilitiesForm onNext={mockOnNext} onBack={mockOnBack} />);

    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByText("Skill #1")).toBeInTheDocument();

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toHaveValue("");
  });

  it("powinien ładować dane początkowe (initial Values) z kontekstu wizarda, jeśli istnieją", () => {
    (useWizard as jest.Mock).mockReturnValue({
      updateAbilities: mockUpdateAbilities,
      wizardData: {
        abilities: [{ name: "React" }, { name: "TypeScript" }],
      },
    });
    render(<AbilitiesForm onNext={mockOnNext} onBack={mockOnBack} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue("React");
    expect(inputs[1]).toHaveValue("TypeScript");
  });

  it("powinien dodać nowe polce po kliknięciu 'Add another skill'", () => {
    render(<AbilitiesForm onNext={mockOnNext} onBack={mockOnBack} />);
    const addButton = screen.getByRole("button", {
      name: /Add another skill/i,
    });

    fireEvent.click(addButton);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(2);
    expect(screen.getByText("Skill #1")).toBeInTheDocument();
    expect(screen.getByText("Skill #2")).toBeInTheDocument();
  });

  it("powinien usunąc pole po klinięciu przycisku 'Remove skill'", async () => {
    (useWizard as jest.Mock).mockReturnValue({
      updateAbilities: mockUpdateAbilities,
      wizardData: {
        abilities: [{ name: "React" }, { name: "TypeScript" }],
      },
    });

    render(<AbilitiesForm onNext={mockOnNext} onBack={mockOnBack} />);

    const inputsBefore = screen.getAllByRole("textbox");
    expect(inputsBefore).toHaveLength(2);

    const deleteButtons = screen.getAllByRole("button", {
      name: /Remove skill/i,
    });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      const inputsAfter = screen.getAllByRole("textbox");
      expect(inputsAfter).toHaveLength(1);
      expect(inputsAfter[0]).toHaveValue("TypeScript");
    });
  });

  it("powinien wyświetlać błędy walidacji, jęsli pole jest puste podczas pórby zapisu", async () => {
    render(<AbilitiesForm onNext={mockOnNext} onBack={mockOnBack} />);
    const nextButton = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(screen.getByText("Skill name is required")).toBeInTheDocument();
    });

    expect(mockUpdateAbilities).not.toHaveBeenCalled();
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it("powinien wyświetlać błędy walidacji, jeśli nazwa umiejętności jest zbyt krótka", async () => {
    render(<AbilitiesForm onNext={mockOnNext} onBack={mockOnBack} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "JS" } });
    const nextButton = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(
        screen.getByText("Skill must be at least 3 characters"),
      ).toBeInTheDocument();
    });
  });

  it("powinien poprawnie zapisać dane i wywołać onNext po poprawnej walidacji", async () => {
    render(<AbilitiesForm onNext={mockOnNext} onBack={mockOnBack} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "PostgreSQL" } });

    const nextButton = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockUpdateAbilities).toHaveBeenCalledTimes(1);
      expect(mockUpdateAbilities).toHaveBeenCalledWith([
        { name: "PostgreSQL" },
      ]);
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });

  it("powinien wywołać funkcję onBack po kliknięciu w przycisk 'Back'", () => {
    render(<AbilitiesForm onNext={mockOnNext} onBack={mockOnBack} />);
    const backButton = screen.getByRole("button", { name: /Back/i });
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
