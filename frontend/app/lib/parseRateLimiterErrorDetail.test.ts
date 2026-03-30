import { parseErrorDetail } from "./parseRateLimiterErrorDetail";

describe("parseErrorDetail Function", () => {
  it("powinien zwrócić domyślny błąd HTTP, gdy errJson jest null lub undefined", () => {
    expect(parseErrorDetail(null, 500)).toBe("HTTP 500");
    expect(parseErrorDetail(undefined, 404)).toBe("HTTP 404");
  });

  it("powinien zwrócić detail.message, jeśli detail to obiekt posiadający to pole (np. rate limit 429)", () => {
    const errJson = {
      detail: {
        message: "Przekroczono limit zapytań",
        innePole: 123,
      },
    };
    expect(parseErrorDetail(errJson, 429)).toBe("Przekroczono limit zapytań");
  });

  it("powinien zrzucić obiekt detail do stringa (JSON.stringify), jeśli nie posiada pola message", () => {
    const errJson = {
      detail: {
        info: "Jakiś błąd obiektu",
        code: 999,
      },
    };
    // Oczekujemy, że funkcja użyje JSON.stringify
    expect(parseErrorDetail(errJson, 400)).toBe(
      '{"info":"Jakiś błąd obiektu","code":999}',
    );
  });

  it("powinien połączyć błędy przecinkiem, jeśli detail to tablica obiektów (np. błędy walidacji pydantic/zod)", () => {
    const errJson = {
      detail: [
        { msg: "Pole email jest wymagane", type: "value_error" },
        { msg: "Wiek musi być liczbą", type: "type_error" },
      ],
    };
    expect(parseErrorDetail(errJson, 422)).toBe(
      "Pole email jest wymagane, Wiek musi być liczbą",
    );
  });

  it("powinien połączyć błędy przecinkiem, jeśli detail to tablica zwykłych stringów", () => {
    const errJson = {
      detail: ["Błąd 1", "Błąd 2", "Błąd 3"],
    };
    expect(parseErrorDetail(errJson, 400)).toBe("Błąd 1, Błąd 2, Błąd 3");
  });

  it("powinien zwrócić detail bezpośrednio, jeśli jest to po prostu string", () => {
    const errJson = {
      detail: "Zwykły tekst błędu",
    };
    expect(parseErrorDetail(errJson, 401)).toBe("Zwykły tekst błędu");
  });

  it("powinien jako fallback użyć pola message z głównego obiektu, jeśli brak pola detail", () => {
    const errJson = {
      message: "Główna wiadomość o błędzie",
      status: "error",
    };
    expect(parseErrorDetail(errJson, 500)).toBe("Główna wiadomość o błędzie");
  });

  it("powinien użyć ostatecznego fallbacku (HTTP status), jeśli obiekt nie ma ani detail ani message", () => {
    const errJson = {
      innyKlucz: "nic przydatnego",
    };
    expect(parseErrorDetail(errJson, 503)).toBe("HTTP 503");
  });

  it("powinien poprawnie zignorować pusty obiekt i zwrócić ostateczny fallback", () => {
    const errJson = {};
    expect(parseErrorDetail(errJson, 403)).toBe("HTTP 403");
  });
});
