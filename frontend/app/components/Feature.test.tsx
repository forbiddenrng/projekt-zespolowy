import { render, screen } from "@testing-library/react";
import Feature from "./Feature";

describe("Feature Component", () => {
  const defaultProps = {
    title: "Testowy Tytuł",
    description: "To jest testowy opis komponentu feature.",
  };

  it("powinien poprawnie renderować tytuł i opis", () => {
    render(<Feature {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
  });

  it("powinien nakładać domyślne klasy kolorów (accent), gdy iconColor nie jest podany", () => {
    const { container } = render(<Feature {...defaultProps} />);
    const iconWrapper = container.querySelector(".w-12.h-12");
    expect(iconWrapper).toHaveClass("bg-accent/10");
    const svgIcon = iconWrapper?.querySelector("svg");
    expect(svgIcon).toHaveClass("text-accent");
  });

  it("powinien nakładać poprawne klasy dla konkretnego wariantu kolorystycznego", () => {
    const { container } = render(
      <Feature {...defaultProps} iconColor="success" />,
    );
    const iconWrapper = container.querySelector(".w-12.h-12");
    const svgIcon = iconWrapper?.querySelector("svg");
    expect(iconWrapper).toHaveClass("bg-success/10");
    expect(svgIcon).toHaveClass("text-success");
  });

  it("powinien posiadać klasy kontenera odpowiedzialne za hover i transition", () => {
    render(<Feature {...defaultProps} />);
    const card = screen.getByText(defaultProps.title).closest("div");
    expect(card).toHaveClass("hover:shadow-xl");
    expect(card).toHaveClass("transition-shadow");
  });
});
