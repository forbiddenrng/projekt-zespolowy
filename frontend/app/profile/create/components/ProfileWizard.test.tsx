import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import ProfileWizard from "./ProfileWizard";
import { useWizard } from "../context/WizardContext";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../context/WizardContext", () => ({
  useWizard: jest.fn(),
}));

// Mocki komponentów z unikalnymi testid
jest.mock("./UserForm", () => ({ onNext }: any) => (
  <div data-testid="step-user">
    <button onClick={onNext}>Next User</button>
  </div>
));
jest.mock("./UserEducation", () => ({ onNext, onBack }: any) => (
  <div data-testid="step-education">
    <button onClick={onBack}>Back Edu</button>
    <button onClick={onNext}>Next Edu</button>
  </div>
));
jest.mock("./UserWorkExperience", () => ({ onNext, onBack }: any) => (
  <div data-testid="step-work">
    <button onClick={onBack}>Back Work</button>
    <button onClick={onNext}>Next Work</button>
  </div>
));
jest.mock("./UserAbilities", () => ({ onNext, onBack }: any) => (
  <div data-testid="step-abilities">
    <button onClick={onBack}>Back Abilities</button>
    <button onClick={onNext}>Next Abilities</button>
  </div>
));
jest.mock("./UserLanguage", () => ({ onNext, onBack }: any) => (
  <div data-testid="step-languages">
    <button onClick={onBack}>Back Languages</button>
    <button onClick={onNext}>Next Languages</button>
  </div>
));
jest.mock("./UserLink", () => ({ onNext, onBack }: any) => (
  <div data-testid="step-links">
    <button onClick={onBack}>Back Links</button>
    <button onClick={onNext}>Next Links</button>
  </div>
));
jest.mock("./UserCertificates", () => ({ onNext, onBack }: any) => (
  <div data-testid="step-certificates">
    <button onClick={onBack}>Back Certs</button>
    <button onClick={onNext}>Next Certs</button>
  </div>
));

describe("ProfileWizzard Component", () => {
  const mockPush = jest.fn();
  const mockUser = { sub: "auth0|123", email: "test@test.com" };
  const mockWizardData = {
    userInfo: {
      name: "Jan",
      surname: "Kowalski",
      email: "test@test.com",
      phoneNum: "123456789",
      city: "Gdynia",
      profileSummary: "Opis profilu",
    },
    education: [
      {
        schoolName: "Uniwersytet",
        major: "Informatyka",
        degree: "Inżynier",
        beginDate: "2020-10-01",
        endDate: "2024-02-01",
      },
    ],
    workExperience: [
      {
        companyName: "Firma X",
        position: "Developer",
        beginDate: "2024-03-01",
        endDate: "",
        description: "Programowanie",
      },
    ],
    abilities: [{ name: "React" }],
    languages: [{ languageId: 1, level: "B2" }],
    links: [{ linkString: "github.com/test" }],
    certificates: [
      {
        name: "Certyfikat AWS",
        issuer: "Amazon",
        certificationDate: "2024-01-01",
      },
    ],
  };

  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useWizard as jest.Mock).mockReturnValue({ wizardData: mockWizardData });
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === "/api/user/language/get") {
        return Promise.resolve({
          json: () => Promise.resolve({ data: [{ id: 1, name: "Angielski" }] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  // Funkcja pomocnicza z await, aby React zdążył przerysować kroki
  const advanceToSummary = async () => {
    fireEvent.click(screen.getByText("Next User"));
    fireEvent.click(await screen.findByText("Next Edu"));
    fireEvent.click(await screen.findByText("Next Work"));
    fireEvent.click(await screen.findByText("Next Abilities"));
    fireEvent.click(await screen.findByText("Next Languages"));
    fireEvent.click(await screen.findByText("Next Links"));
    fireEvent.click(await screen.findByText("Next Certs"));
  };

  it("powinien renderować początkowy krok (Personal Data)", async () => {
    await act(async () => {
      render(<ProfileWizard user={mockUser} />);
    });
    const firstStepLabel = screen.getByText("Personal Data");
    expect(firstStepLabel).toBeInTheDocument();
  });

  it("powinien nawigować do przodu i do tyłu pomiędzy krokami", async () => {
    await act(async () => {
      render(<ProfileWizard user={mockUser} />);
    });

    fireEvent.click(screen.getByText("Next User"));
    expect(await screen.findByTestId("step-education")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Next Edu"));
    expect(await screen.findByTestId("step-work")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Back Work"));
    expect(await screen.findByTestId("step-education")).toBeInTheDocument();
  });

  it("powinien poprawnie wyrenderować Summary Step ze zgromadzonymi danymi z kontekstu", async () => {
    await act(async () => {
      render(<ProfileWizard user={mockUser} />);
    });

    await act(async () => {
      await advanceToSummary();
    });

    const summaryHeading = await screen.findByRole("heading", {
      name: /^Summary$/i,
      level: 2,
    });

    expect(summaryHeading).toBeInTheDocument();
    expect(screen.getByText("Jan Kowalski")).toBeInTheDocument();
    expect(screen.getByText("Uniwersytet")).toBeInTheDocument();
    expect(screen.getByText("Firma X")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("github.com/test")).toBeInTheDocument();
    expect(screen.getByText("Certyfikat AWS")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Angielski")).toBeInTheDocument();
    });
  });

  it("powinien wysłać poprawne dane przez API po kliknięciu 'Save Profile' i przekierować usera", async () => {
    await act(async () => {
      render(<ProfileWizard user={mockUser} />);
    });
    await act(async () => {
      await advanceToSummary();
    });

    const submitButton = await screen.getByRole("button", {
      name: /Save Profile/i,
    });
    fireEvent.click(submitButton);
    expect(screen.getByRole("button", { name: /Saving.../i })).toBeDisabled();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);

      const fetchArgs = (global.fetch as jest.Mock).mock.calls[1];
      expect(fetchArgs[0]).toBe("/api/user/create");
      expect(fetchArgs[1].method).toBe("POST");

      const payload = JSON.parse(fetchArgs[1].body);
      expect(payload.email).toBe("test@test.com");
      expect(payload.name).toBe("Jan");
      expect(payload.education).toHaveLength(1);
    });

    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it("powinien obsłużyć błąd podczas wysyłania do API (przywrócić stan przycisku i nie nawigować)", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === "/api/user/language/get")
        return Promise.resolve({ json: () => Promise.resolve({ data: [] }) });
      if (url === "/api/user/create")
        return Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve("Błąd"),
        });
      return Promise.resolve();
    });

    jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      render(<ProfileWizard user={mockUser} />);
    });

    await act(async () => {
      await advanceToSummary();
    });

    const submitButton = screen.getByRole("button", {
      name: /Save Profile/i,
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
      const btn = screen.getByRole("button", { name: /Save Profile/i });
      expect(btn).toBeInTheDocument();
      expect(btn).not.toBeDisabled();
    });
  });
});
