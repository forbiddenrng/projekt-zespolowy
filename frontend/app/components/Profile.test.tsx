import { render, screen } from "@testing-library/react";
import Profile from "./Profile";
import { useUser } from "@auth0/nextjs-auth0";
import "@testing-library/jest-dom";

jest.mock("@auth0/nextjs-auth0", () => ({
  useUser: jest.fn(),
}));

describe("Profile Component", () => {
  it("powinien wyświetlić stan ładowania, gdy isLoading jest true", () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    });
    render(<Profile />);
    expect(screen.getByText(/loading user profile/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("powinien zwrócić null (nic nie renderować), gdy nie ma użytkownika", () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });
    const { container } = render(<Profile />);
    expect(container.firstChild).toBeNull();
  });

  it("powinien wyrenderować dane użytkownika, gdy jest zalogowany", () => {
    const mockUser = {
      name: "Jan Kowalski",
      email: "jan@example.com",
      picture: "https://example.com/photo.jpg",
    };
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
    });
    render(<Profile />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    const profileImg = screen.getByRole("img");
    expect(profileImg).toHaveAttribute("src", mockUser.picture);
    expect(profileImg).toHaveAttribute("alt", mockUser.name);
  });

  it("powinien użyć domyślnego alt dla zdjęcia, jeśli user.name nie istnieje", () => {
    (useUser as jest.Mock).mockReturnValue({
      user: { picture: "src.jpg" },
      isLoading: false,
    });
    render(<Profile />);
    const profileImg = screen.getByRole("img");
    expect(profileImg).toHaveAttribute("alt", "User profile");
  });
});
