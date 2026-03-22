import { render, screen } from "@testing-library/react";
import Navigation from "./Navigation";
import "@testing-library/jest-dom";

jest.mock("./Logo", () => {
  return function MockLogo() {
    return <div data-testid="mock-logo">Logo</div>;
  };
});

jest.mock("./LoginButton", () => {
  return function MockLoginButton({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-login-button">{children}</div>;
  };
});

describe("Navigation Component", () => {
  const mockProps = {
    user: null,
  };

  it("powinien wyrenderować logo", () => {
    render(<Navigation {...mockProps} />);
    expect(screen.getByTestId("mock-logo")).toBeInTheDocument();
  });

  it("powinien zawierać linki nawigacyjne z poprawnymi kotwicami", () => {
    render(<Navigation {...mockProps} />);
    const featuresLink = screen.getByRole("link", { name: /features/i });
    const howItWorksLink = screen.getByRole("link", { name: /how it works/i });
    expect(featuresLink).toHaveAttribute("href", "#features");
    expect(howItWorksLink).toHaveAttribute("href", "#how-it-works");
  });

  it("powinien wyrenderować przycisk logowania z napisem 'Sign in'", () => {
    render(<Navigation {...mockProps} />);
    expect(screen.getByTestId("mock-login-button")).toBeInTheDocument();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it("powinien posiadać klasy CSS dla efektu przezroczystości i rozmycia tła", () => {
    render(<Navigation {...mockProps} />);
    const navElement = screen.getByRole("navigation");
    expect(navElement).toHaveClass("bg-background/80");
    expect(navElement).toHaveClass("backdrop-blur-md");
    expect(navElement).toHaveClass("fixed", "top-0");
  });

  it("powinien ukrywać linki tekstowe na małych ekranach (klasa hidden md:flex)", () => {
    render(<Navigation {...mockProps} />);
    const linksContainer = screen.getByText(/features/i).closest("div");
    expect(linksContainer).toHaveClass("hidden");
    expect(linksContainer).toHaveClass("md:flex");
  });
});
