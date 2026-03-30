import { render, screen } from "@testing-library/react";
import LoginButton from "./LoginButton";

describe("LoginButton Component", () => {
  it("powinien wyrenderować dzieci (children) przekazane do komponentu", () => {
    const buttonText = "Zaloguj się teraz";
    render(<LoginButton>{buttonText}</LoginButton>);
    const linkElement = screen.getByText(buttonText);
    expect(linkElement).toBeInTheDocument();
  });

  it("powinien posiadać poprawny atrybut herf prowadzący do ścieżki logowania", () => {
    render(<LoginButton>Login</LoginButton>);
    const linkElement = screen.getByRole("link", { name: /login/i });
    expect(linkElement).toHaveAttribute("href", "/auth/login");
  });

  it("powinien posiadać odpowiednie klasy CSS do stylowania", () => {
    render(<LoginButton>Login</LoginButton>);
    const linkElement = screen.getByRole("link");
    expect(linkElement).toHaveClass("button");
    expect(linkElement).toHaveClass("login");
  });
});
