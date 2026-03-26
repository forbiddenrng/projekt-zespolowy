import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import UserData from "./UserData";

jest.mock("next/link", () => {
  return ({ children, href, className }: any) => {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

global.fetch = jest.fn() as jest.Mock;

describe("UserData Component", () => {
  const mockUserData = {
    id: 1,
    auth0_id: "auth0|123456",
    name: "Jan",
    surname: "Kowalski",
    phone_number: "123456789", // Zostanie sformatowane jako "123 456 789"
    email: "jan.kowalski@example.com",
    city: "Warszawa",
    profile_summary: "Doświadczony programista React.",
    abilities: [
      { id: 1, name: "React" },
      { id: 2, name: "TypeScript" },
    ],
    certificates: [
      {
        id: 1,
        name: "AWS Certified Developer",
        issuer: "Amazon",
        certification_date: "2024-01-15T10:00:00Z",
      },
    ],
    education: [
      {
        id: 1,
        school_name: "Politechnika Warszawska",
        major: "Informatyka",
        degree: "Inżynier",
        begin_date: "2018-10-01T00:00:00Z",
        end_date: "2022-02-01T00:00:00Z",
      },
    ],
    links: [{ id: 1, linkString: "https://github.com/jankowalski" }],
    work_experiences: [
      {
        id: 1,
        company_name: "Tech Solutions",
        position: "Frontend Developer",
        begin_date: "2022-03-01T00:00:00Z",
        end_date: null, // "present"
        description: "Tworzenie nowoczesnych aplikacji webowych.",
      },
    ],
    user_languages: [{ language: { id: 1, name: "Angielski", code: "EN" } }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockUserData }),
    });
  });

  it("powinien wyświetlać stan ładowania (LoadingSpinner) na samym początku", async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (global.fetch as jest.Mock).mockReturnValue(promise);

    render(<UserData />);
    expect(screen.getByText("Loading profile...")).toBeInTheDocument();

    await act(async () => {
      resolvePromise({ ok: true, json: async () => ({ data: mockUserData }) });
    });
  });

  it("powinien wyświetlać ErrorMessage, jeśli fetch zwróci wyjątek (np. błąd sieci)", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network Error"));
    render(<UserData />);
    expect(
      await screen.findByText("Failed to fetch profile data."),
    ).toBeInTheDocument();
  });

  it("powinien wyświetlać ErrorMessage, jeśli status odpowiedzi nie jest OK", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });
    render(<UserData />);
    expect(
      await screen.findByText("Failed to fetch profile data."),
    ).toBeInTheDocument();
  });

  it("powinien poprawnie renderować dane użytkownika po udanym pobraniu z API", async () => {
    render(<UserData />);
    expect(await screen.findByText("My Profile")).toBeInTheDocument();

    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Kowalski")).toBeInTheDocument();
    expect(screen.getByText("jan.kowalski@example.com")).toBeInTheDocument();
    expect(screen.getByText("Warszawa")).toBeInTheDocument();
    expect(screen.getByText("123 456 789")).toBeInTheDocument();
    expect(
      screen.getByText(/^Doświadczony programista React.$/i),
    ).toBeInTheDocument();

    expect(screen.getByText("Politechnika Warszawska")).toBeInTheDocument();
    expect(screen.getByText("Informatyka")).toBeInTheDocument();

    expect(screen.getByText("Tech Solutions")).toBeInTheDocument();
    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    expect(
      screen.getByText("Tworzenie nowoczesnych aplikacji webowych."),
    ).toBeInTheDocument();
    expect(screen.getByText(/present/i)).toBeInTheDocument();

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();

    expect(screen.getByText("Angielski")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();

    expect(screen.getByText("github.com/jankowalski")).toBeInTheDocument();

    expect(screen.getByText("AWS Certified Developer")).toBeInTheDocument();
    expect(screen.getByText("Amazon")).toBeInTheDocument();
  });

  it("powinien renderować komponenty EmptyState dla pustych sekcji", async () => {
    const emptyUserData = {
      ...mockUserData,
      abilities: [],
      certificates: [],
      education: [],
      links: [],
      work_experiences: [],
      user_languages: [],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: emptyUserData }),
    });

    render(<UserData />);
    expect(await screen.findByText("My Profile")).toBeInTheDocument();

    expect(
      screen.getByText("You haven't added any education yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You haven't added any work experience yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You haven't added any skills yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You haven't added any languages yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You haven't added any links yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You haven't added any certificates yet"),
    ).toBeInTheDocument();
  });
});
