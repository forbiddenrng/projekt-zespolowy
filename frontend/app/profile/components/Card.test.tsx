import React from "react";
import { render, screen } from "@testing-library/react";
import Card from "./Card";

jest.mock("./EditButton", () => {
  return function MockEditButton({ href }: { href: string }) {
    return (
      <a data-testid="edit-button" href={href}>
        Edit
      </a>
    );
  };
});

describe("Card Compoennt", () => {
  it("powinien poprawnie renderować przekazaną treść (children)", () => {
    render(
      <Card>
        <p>Przykładowa treśc karty</p>
      </Card>,
    );
  });

  it("powinien nakładać bazowe klasy stylujące", () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.firstChild).toHaveClass(
      "p-6",
      "relative",
      "bg-card-background",
      "border",
      "border-card-border",
      "rounded-lg",
      "shadow",
    );
  });

  it("powinien doklejać niestandardowe klasy z propsa 'className'", () => {
    const { container } = render(
      <Card className="mt-8 hover:shadow-xl">Test z klasami</Card>,
    );
    expect(container.firstChild).toHaveClass("mt-8", "hover:shadow-xl");
    expect(container.firstChild).toHaveClass("p-6", "shadow");
  });

  it("nie powinien renderować przycisku EditButton ani dodawać klasy pr-12, gdy nie podano editHref", () => {
    render(
      <Card>
        <div data-testid="content-wrapper">Treść bez edycji</div>
      </Card>,
    );

    expect(screen.queryByTestId("edit-button")).not.toBeInTheDocument();

    const contentWrapper = screen.getByTestId("content-wrapper").parentElement;
    expect(contentWrapper).not.toHaveClass("pr-12");
  });

  it("powinien wyrenderować EditButton z odpowiednim linkiem i dodać klasę pr-12 do kontenera treści, gdy podano editHref", () => {
    render(
      <Card editHref="/ustawienia/edytuj">
        <div data-testid="content-wrapper">Treść z edycją</div>
      </Card>,
    );

    const editButton = screen.getByTestId("edit-button");
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveAttribute("href", "/ustawienia/edytuj");

    const contentWrapper = screen.getByTestId("content-wrapper").parentElement;
    expect(contentWrapper).toHaveClass("pr-12");
  });
});
