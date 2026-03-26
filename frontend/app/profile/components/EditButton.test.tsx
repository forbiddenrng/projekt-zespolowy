import React from "react";
import { render, screen } from "@testing-library/react";
import EditButton from "./EditButton";

jest.mock("next/link", () => {
  return ({ children, href, className, title }: any) => {
    return (
      <a
        href={href}
        className={className}
        title={title}
        data-testid="edit-link"
      >
        {children}
      </a>
    );
  };
});
describe("EditButton Component", () => {
  it("powinien poprawnie renderować komponent", () => {
    render(<EditButton href="/edytuj/1" />);
    const linkElement = screen.getByTestId("edit-link");
    expect(linkElement).toBeInTheDocument();
  });

  it("powinien przekazywać poprawny atrybut href do linku", () => {
    render(<EditButton href="/ustawienia/profil" />);
    const linkElement = screen.getByTestId("edit-link");
    expect(linkElement).toHaveAttribute("href", "/ustawienia/profil");
  });

  it("powinien posiadać atrybut title='Edytuj' dla ułatwienia dostępu (accessability)", () => {
    render(<EditButton href="/edytuj/1" />);
    const linkElementByTitle = screen.getByTitle("Edytuj");
    expect(linkElementByTitle).toBeInTheDocument();

    const linkElementByTestId = screen.getByTestId("edit-link");
    expect(linkElementByTestId).toHaveAttribute("title", "Edytuj");
  });

  it("powinien nakładać odpowiednie klasy stylujące Tailwind CSS", () => {
    render(<EditButton href="/edytuj/1" />);

    const linkElement = screen.getByTestId("edit-link");
    expect(linkElement).toHaveClass(
      "inline-flex",
      "items-center",
      "justify-center",
      "w-8",
      "h-8",
      "rounded-lg",
      "bg-primary/10",
      "hover:bg-primary/20",
      "text-primary",
      "transition-colors",
      "duration-200",
    );
  });
});
