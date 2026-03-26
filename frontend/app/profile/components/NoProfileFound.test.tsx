import React from "react";
import { render, screen } from "@testing-library/react";
import NoProfileFound from "./NoProfileFound";

jest.mock("next/link", () => {
  return ({ children, href, className }: any) => {
    return (
      <a href={href} className={className} data-testid="create-profile-link">
        {children}
      </a>
    );
  };
});

describe("NoProfileFound Component", () => {
  it("powinien poprawnie renderować nagłówek i opis", () => {
    render(<NoProfileFound />);
    expect(screen.getByText("Profile Not Found")).toBeInTheDocument();
    expect(
      screen.getByText(
        "It looks like you haven't created a profile yet. Set up your profile to take full advantage of the application.",
      ),
    ).toBeInTheDocument();
  });

  it("powinien renderować link do tworzenia prodilu z prawidłowym adresem", () => {
    render(<NoProfileFound />);
    const linkElement = screen.getByTestId("create-profile-link");
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveTextContent("Create Profile");
    expect(linkElement).toHaveAttribute("href", "/profile/create");
  });
  it("powinien nakładać odpowiednie klasy stylujące na główny kontener (layout pełnoekranowy)", () => {
    const { container } = render(<NoProfileFound />);

    // Sprawdzamy klasy głównego wrappera (min-h-screen zapewnia pełny ekran)
    expect(container.firstChild).toHaveClass(
      "min-h-screen",
      "bg-background",
      "flex",
      "items-center",
      "justify-center",
      "p-4",
    );
  });

  it("powinien nakładać odpowiednie klasy stylujące na wewnętrzną kartę", () => {
    const { container } = render(<NoProfileFound />);

    const innerCard = container.firstChild?.firstChild;

    expect(innerCard).toHaveClass(
      "bg-card-background",
      "border",
      "border-card-border",
      "rounded-lg",
      "shadow-lg",
      "p-8",
      "max-w-md",
      "w-full",
      "text-center",
    );
  });

  it("powinien nakładać odpowiednie klasy na wyrenderowany przycisk/link", () => {
    render(<NoProfileFound />);

    const linkElement = screen.getByTestId("create-profile-link");

    expect(linkElement).toHaveClass(
      "inline-block",
      "bg-primary",
      "hover:bg-primary-hover",
      "text-white",
      "font-semibold",
      "py-3",
      "px-6",
      "rounded-lg",
      "transition-colors",
      "duration-200",
    );
  });
});
