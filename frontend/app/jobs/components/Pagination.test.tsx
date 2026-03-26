import React, { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "./Pagination";

describe("Pagination Component", () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("nie powinien renderować niczego (zwrócić null), jeśli jest 1 strona lub mniej", () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalItems={5}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("powinien wyrenderować odpowiednią liczbę przycisków stron na podstawie totalItems i itemsPerPage", () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={25}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />,
    );

    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "4" })).not.toBeInTheDocument();
  });

  it("powinien zablokować przycisk 'Poprzednia', gdy currentPage wynosi 1", () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={30}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />,
    );

    const prevButton = screen.getByRole("button", { name: /Poprzednia/i });
    const nextButton = screen.getByRole("button", { name: /Następna/i });

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it("powinien zablokować przycisk 'Następna', gdy currentPage to ostatnia strona", () => {
    render(
      <Pagination
        currentPage={3}
        totalItems={24}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />,
    );

    const prevButton = screen.getByRole("button", { name: /Poprzednia/i });
    const nextButton = screen.getByRole("button", { name: /Następna/i });

    expect(prevButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it("powinien wywołać onPageChange z odpowiednim numerem po kliknięciu w konkretną stronę", () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={30}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />,
    );

    const page2Button = screen.getByRole("button", { name: "2" });
    fireEvent.click(page2Button);

    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it("powinien wywołać onPageChange(currentPage - 1) po kliknięciu w 'Poprzednia'", () => {
    render(
      <Pagination
        currentPage={3}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />,
    );

    const prevButton = screen.getByRole("button", { name: /Poprzednia/i });
    fireEvent.click(prevButton);

    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it("powinien wywołać onPageChange(currentPage +1 1) po kliknięciu w 'Następna'", () => {
    render(
      <Pagination
        currentPage={3}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />,
    );

    const nextButton = screen.getByRole("button", { name: /Następna/i });
    fireEvent.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it("powinien nakładać odpowiednie klasy (aktywne) na przycisk bieżącej strony", () => {
    render(
      <Pagination
        currentPage={2}
        totalItems={30}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />,
    );

    const activePageButton = screen.getByRole("button", { name: "2" });
    const inactivePageButton = screen.getByRole("button", { name: "1" });

    expect(activePageButton).toHaveClass("bg-primary", "text-white");
    expect(inactivePageButton).toHaveClass("bg-card_background", "text-muted");
    expect(inactivePageButton).not.toHaveClass("bg-primary", "text-white");
  });
});
