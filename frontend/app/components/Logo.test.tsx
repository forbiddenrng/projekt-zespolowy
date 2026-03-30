import { render, screen } from "@testing-library/react";
import Logo from "./Logo";

describe("Logo Component", () => {
  it("powinien wyrenderować pełną nazwę 'JobMatch.AI'", () => {
    render(<Logo />);
    const logoText = screen.getByText(/JobMatch/i);
    const extensionText = screen.getByText(/\.AI/i);
    expect(logoText).toBeInTheDocument();
    expect(extensionText).toBeInTheDocument();
  });

  it("powinien być linkiem prowadzącym do strony głównej (/) ", () => {
    render(<Logo />);
    const linkElement = screen.getByRole("link");
    expect(linkElement).toHaveAttribute("href", "/");
  });

  it("powinien posiadać odpowiednie klasy CSS dla efektu hover i przejść", () => {
    render(<Logo />);
    const linkElement = screen.getByRole("link");
    const textSpan = linkElement.querySelector("span");
    expect(linkElement).toHaveClass("flex", "items-center", "group");
    expect(textSpan).toHaveClass(
      "group-hover:text-primary",
      "transition-colors",
    );
  });

  it("powinien renderować kropkę i AI z kolorem primary", () => {
    render(<Logo />);
    const extension = screen.getByText(".AI");
    expect(extension).toHaveClass("text-primary");
  });
});
