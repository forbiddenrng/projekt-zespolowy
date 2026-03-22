import { render, screen } from "@testing-library/react";
import LogoutButton from "./LogoutButton";
import "@testing-library/jest-dom";

describe("LogoutButton Component", () => {
  it("powinien wyrenderować treść przekazaną jako children", () => {
    render(<LogoutButton>Wyloguj mnie</LogoutButton>);
    const buttonText = screen.getByText(/wyloguj mnie/i);
    expect(buttonText).toBeInTheDocument();
  });

  it("powinien posiadać atrybut href skierowany na /auth/logout", () => {
    render(<LogoutButton>Logout</LogoutButton>);
    const linkElement = screen.getByRole("link", { name: /logout/i });
    expect(linkElement).toHaveAttribute("href", "/auth/logout");
  });

  it("powinien posiadać klasy CSS 'button' oraz 'logout'", () => {
    render(<LogoutButton>Logout</LogoutButton>);
    const linkElement = screen.getByRole("link");
    expect(linkElement).toHaveClass("button");
    expect(linkElement).toHaveClass("logout");
  });

  it("powinien poprawnie renderować elementy HTML jako children", () => {
    render(
      <LogoutButton>
        <span data-testid="icon">icon</span>
        Logout
      </LogoutButton>,
    );
    const iconElement = screen.getByTestId("icon");
    expect(iconElement).toBeInTheDocument();
  });
});
