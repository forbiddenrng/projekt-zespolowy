import { render, screen } from "@testing-library/react";
import WelcomePage from "./WelcomePage";
import "@testing-library/jest-dom";

jest.mock("./Navigation", () => () => <nav data-testid="mock-nav" />);
jest.mock("./Feature", () => ({ title }: { title: string }) => (
  <div data-testid="mock-feature">{title}</div>
));
jest.mock(
  "./LoginButton",
  () =>
    ({ children }: { children: React.ReactNode }) => (
      <div data-testid="mock-login">{children}</div>
    ),
);
jest.mock("../data/data", () => ({
  features: [
    { id: 1, title: "AI Generation", description: "Desc 1" },
    { id: 2, title: "Job Matching", description: "Desc 2" },
  ],
}));

describe("WelcomePage Component", () => {
  it("powinien wyrenderować nawigację z nullowym użytkownikiem", async () => {
    render(await WelcomePage());
    expect(screen.getByTestId("mock-nav")).toBeInTheDocument();
  });

  it("powinien wyświetlać główny nagłówek Hero Section", async () => {
    render(await WelcomePage());
    const mainHeading = screen.getByRole("heading", { level: 1 });
    expect(mainHeading).toHaveTextContent(/JobMatch\.AI/i);
    expect(
      screen.getByText(/Intelligent AI Resume & Cover Letter Generator/i),
    ).toBeInTheDocument();
  });

  it("powinien wyrenderować listę cech (features) na podstawie danych", async () => {
    render(await WelcomePage());
    const features = screen.getAllByTestId("mock-feature");
    expect(features).toHaveLength(2);
    expect(screen.getByText("AI Generation")).toBeInTheDocument();
  });

  it("powinien posiadać sekcję 'How It Works' z trzema krokami", async () => {
    render(await WelcomePage());
    const sectionHeading = screen.getByRole("heading", {
      name: /^How It Works$/i,
    });
    expect(sectionHeading).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/Complete Your Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Paste a Job Offer/i)).toBeInTheDocument();
    expect(screen.getByText(/Download Documents/i)).toBeInTheDocument();
  });

  it("powinien zawierać przycisk wezwania do działania (CTA) w stopce i hero", async () => {
    render(await WelcomePage());
    expect(screen.getByTestId("mock-login")).toHaveTextContent(
      /Get Started for Free/i,
    );
    const bottomCta = screen.getByRole("button", {
      name: /Start Now - It's Free!/i,
    });
    expect(bottomCta).toBeInTheDocument();
    expect(bottomCta).toHaveClass("bg-white", "text-primary");
  });

  it("powinien wyrenderować stopkę z prawami autorskimi i linkami", async () => {
    render(await WelcomePage());
    expect(screen.getByText(/© 2026 JobMatch\.AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
    expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
  });
});
