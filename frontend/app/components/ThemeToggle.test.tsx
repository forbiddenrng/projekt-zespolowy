import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "./ThemeToggle";
import "@testing-library/jest-dom";

describe("ThemeToggle Component", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = "";
    jest.clearAllMocks();
  });

  it("powinien zainicjalizować się z motywem jasnym (domyślnie)", () => {
    render(<ThemeToggle />);
    expect(screen.getByText(/jasny motyw/i)).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("powinien zmienić motyw na ciemny po kliknięciu", () => {
    render(<ThemeToggle />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(screen.getByText(/ciemny motyw/i)).toBeInTheDocument();
    expect(document.body.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("powinien wczytać zapisany motyw z localStorage przy montowaniu", () => {
    localStorage.setItem("theme", "dark");
    render(<ThemeToggle />);
    expect(screen.getByText(/ciemny motyw/i)).toBeInTheDocument();
    expect(document.body.classList.contains("dark")).toBe(true);
  });

  it("powinien poprawnie przełączać klasy na body (usuwać starą, dodawać nową)", () => {
    render(<ThemeToggle />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(document.body.classList.contains("dark")).toBe(true);
    expect(document.body.classList.contains("light")).toBe(false);
    fireEvent.click(checkbox);
    expect(document.body.classList.contains("light")).toBe(true);
    expect(document.body.classList.contains("dark")).toBe(false);
  });

  it("powinien posiadać ukryty input dla czytników ekranu (sr-only)", () => {
    render(<ThemeToggle />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveClass("sr-only");
  });
});
