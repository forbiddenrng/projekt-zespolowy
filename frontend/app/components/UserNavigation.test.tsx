import { render, screen } from "@testing-library/react";
import UserNavigation from "./UserNavigation";
import { usePathname } from "next/navigation";
import "@testing-library/jest-dom";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("./Logo", () => () => <div data-testid="logo">Logo</div>);
jest.mock("./ThemeToggle", () => () => (
  <div data-testid="theme-toggle">Theme</div>
));
jest.mock(
  "./LogoutButton",
  () =>
    ({ children }: { children: React.ReactNode }) => (
      <div data-testid="logout-wrapper">{children}</div>
    ),
);

describe("UserNavigation Component", () => {
  const mockUser = {
    name: "Alex Designer",
    email: "alex@example.com",
  };

  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard");
  });

  it("powinien renderować profil użytkownika, gdy dane są przekazane", () => {
    render(<UserNavigation user={mockUser} />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("powinien wyświetlać wszystkie elementy menu z poprawnymi etykietami", () => {
    render(<UserNavigation user={mockUser} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Generate Document")).toBeInTheDocument();
    expect(screen.getByText("Job Offers")).toBeInTheDocument();
  });

  it("powinien nadać klasę aktywności linkowi pasującemu do obecnej ścieżki", () => {
    (usePathname as jest.Mock).mockReturnValue("/profile");
    render(<UserNavigation user={mockUser} />);
    const profileLink = screen.getByRole("link", { name: /profile/i });
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(profileLink).toHaveClass("bg-primary");
    expect(profileLink).toHaveClass("text-white");
    expect(dashboardLink).not.toHaveClass("bg-primary");
    expect(dashboardLink).toHaveClass("text-muted");
  });

  it("powinien wyrenderować LogoutButton z tekstem 'Sign out'", () => {
    render(<UserNavigation user={mockUser} />);
    const logoutWrapper = screen.getByTestId("logout-wrapper");
    expect(logoutWrapper).toBeInTheDocument();
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
  });

  it("powinien poprawnie obsługiwać brak imienia użytkownika (fallback do emaila)", () => {
    const userWithOnlyEmail = { email: "test@example.com" };
    render(<UserNavigation user={userWithOnlyEmail} />);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument(); // Fallback z Twojego kodu
    expect(screen.getByText("T")).toBeInTheDocument(); // Inicjał z emaila
  });
});
