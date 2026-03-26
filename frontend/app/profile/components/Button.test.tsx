import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "./Button";

jest.mock("next/link", () => {
  return ({ children, href, className }: any) => {
    return (
      <a href={href} className={className} data-testid="next-link">
        {children}
      </a>
    );
  };
});

describe("Button Component", () => {
  it("powinien renderować domyślny element <button> , gdy nie podano href", () => {
    render(<Button>Kliknij mnie</Button>);
    const button = screen.getByRole("button", { name: /Kliknij mnie/i });
    expect(button).toBeInTheDocument();
    expect(screen.queryByTestId("next-link")).not.toBeInTheDocument();
  });

  it("powinien wywoływać funkcję onClick po kliknięciu", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Akcja</Button>);
    const button = screen.getByRole("button", { name: /Akcja/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("powinien renderować komponent Link z Next.js, gdy podano href", () => {
    render(<Button href="/o-nas">Przejdz dalej</Button>);
    const link = screen.getByTestId("next-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/o-nas");
    expect(link).toHaveTextContent("Przejdz dalej");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("powinien nakładać bazowe klasy, domyślny wariant 'primary' i domyślny rozmiar 'md'", () => {
    render(<Button>Domyślny Button</Button>);
    const button = screen.getByRole("button", { name: /Domyślny Button/i });
    expect(button).toHaveClass(
      "inline-flex",
      "items-center",
      "justify-center",
      "gap-2",
      "transition-colors",
    );
    expect(button).toHaveClass(
      "bg-primary",
      "hover:bg-primary-hover",
      "text-white",
    );
    expect(button).toHaveClass("py-2", "px-4");
  });

  it("powinien nakładać poprawne klasy dla wariantu 'secondary'", () => {
    render(<Button variant="secondary">Drugorzędny</Button>);
    const button = screen.getByRole("button", { name: /Drugorzędny/i });
    expect(button).toHaveClass(
      "bg-secondary",
      "hover:bg-border",
      "text-foreground",
    );
    expect(button).not.toHaveClass("bg-primary");
  });

  it("powinien nakładać poprawne klasy dla wariantu 'outline'", () => {
    render(<Button variant="outline">Obrys</Button>);
    const button = screen.getByRole("button", { name: /Obrys/i });
    expect(button).toHaveClass(
      "border",
      "border-border",
      "hover:bg-secondary",
      "text-foreground",
    );
  });

  it("powinien nakładać poprawne klasy dla rozmiaru 'sm'", () => {
    render(<Button size="sm">Mały</Button>);
    const button = screen.getByRole("button", { name: /Mały/i });
    expect(button).toHaveClass("py-1.5", "px-3", "text-sm");
    expect(button).not.toHaveClass("py-2", "px-4");
  });

  it("powinien nakładać poprawne klasy dla rozmiaru 'lg'", () => {
    render(<Button size="lg">Duży</Button>);
    const button = screen.getByRole("button", { name: /Duży/i });
    expect(button).toHaveClass("py-3", "px-6", "text-lg");
  });

  it("powinien doklejać niestandardowe klasy z propsa 'className'", () => {
    render(<Button className="mt-8 w-full">Z customowymi klasami</Button>);
    const button = screen.getByRole("button", {
      name: /Z customowymi klasami/i,
    });
    expect(button).toHaveClass("mt-8", "w-full");
    expect(button).toHaveClass("bg-primary", "inline-flex");
  });
});
