# User Service — Dokumentacja

Krótki opis
- Serwis użytkowników napisany w **NestJS** z użyciem **Prisma** jako ORM.
- Struktura bazy została zaprojektowana z myślą o przechowywaniu danych użytkownika (CV/Portfolio), w tym edukacji, doświadczenia, języków, certyfikatów i umiejętności technicznych.

## Szybki start (po sklonowaniu repo)
1. Zainstaluj zależności:
   ```sh
   npm install
   ```
2. Wygeneruj klienta Prisma:
   ```sh
   npx prisma generate
   ```
3. Uruchom bazę danych (jeśli w repo jest `docker-compose.yml`):
   ```sh
   docker compose up -d
   ```
   Upewnij się, że connection string w `prisma/schema.prisma` wskazuje na uruchomioną bazę.
4. Uruchom serwis w trybie deweloperskim:
   ```sh
   npm run start:dev
   ```

## Struktura projektu (ważne pliki)
- src/main.ts — entrypoint aplikacji
- src/users/
  - users.controller.ts — definicje endpointów
  - users.service.ts — logika tworzenia/pobierania/usuwania użytkowników
  - dto/*.ts — DTO używane do walidacji/transferu danych (create-user.dto.ts, create-ability.dto.ts, itd.)
- src/database/database.service.ts — wrapper Prisma (używany przez UsersService)
- src/interceptors/response/response.interceptor.ts — mapuje odpowiedzi kontrolerów do formatu SuccessResponse
- src/filters/all-exceptions-filter/all-exceptions.filter.ts — globalny filtr wyjątków (ErrorResponse)
- src/prisma-client-exception/prisma-client-exception.filter.ts — obsługa znanych błędów Prisma (np. P2002)

## Uruchomienie
- Dev: `sh npm run start:dev`
- Production build: `npm run build` i `node dist/main.js`

---

## API — dostępne endpointy

Wszystkie ścieżki zaczynają się od `/users`.

Formaty ogólne:
- Sukces (ResponseInterceptor) — SuccessResponse:
  ```json
  {
    "status": "success",
    "statusCode": 200,
    "data": { /* payload lub null */ },
    "message": "string or null"
  }
  ```
- Błąd (AllExceptionsFilter) — ErrorResponse:
  ```json
  {
    "status": "error",
    "statusCode": 400,
    "message": "string | string[]",
    "error": "szczegóły / description / cause",
    "timestamp": "2025-11-09T...",
    "path": "/users/..."
  }
  ```
- Prisma-known error (np. P2002 — unique constraint) obsługiwany przez PrismaClientExceptionFilter zwraca co najmniej:
  ```json
  {
    "statusCode": 409,
    "message": "Unique constraint failed on the fields: (...)"
  }
  ```

### 1) Tworzenie użytkownika
- Metoda: POST
- Ścieżka: /users
- Body (JSON) — pola akceptowane przez CreateUserDto i używane w buildCreateData:




```json
{
  "auth0Id": "string", // mapowane na auth0_id
  "email": "string",
  "phoneNumber": "string" // mapowane na phone_number
  "name": "string",
  "surname": "string",
  "city": "string",
  "profileSummary": "string", // OPTIONAL mapowane na profile_summary
  "abilities": [ // OPTIONAL
    {"name": "string"}
  ],
  "certificates": [ // OPTIONAL
    {
      "name": "string",
      "issuer": "string",
      "certificationDate": "Date"
    }
  ],
  "education": [ //OPTIONAL
    { 
      "schoolName": "string", 
      "major": "string", 
      "degree": "string", 
      "beginDate": "string", //(ISO), 
      "endDate": "string" // OPTIONAL (ISO) 
    } 
  ], 
  "links": [ // OPTIONAL
    {"linkString": "string"}
  ],
  "workExperience": [ //OPTIONAL
    { 
      "position": "string", 
      "description": "string", 
      "companyName": "string", 
      "beginDate": "string", //(ISO), 
      "endDate": "string" // OPTIONAL (ISO) 
    }
  ], 
  "languages": [ //OPTIONAL
    { 
      "languageId": "number", 
      "level": "string" 
    }
  ]
}
```

- Działanie:
  - Buduje obiekt do zapisu (mapowania nazw pól -> zgodne z DB).
  - Sprawdza czy użytkownik nie istnieje (po auth0_id, email, phone_number).
  - Jeśli OK — zapisuje w bazie i zwraca wybrane pola nowego użytkownika.

- Przykładowy request:
  ```json
  {
    "auth0Id": "auth0|123",
    "email": "jan@example.com",
    "phoneNumber": "+48123123123",
    "name": "Jan",
    "surname": "Kowalski",
    "city": "Warszawa",
    "profileSummary": "Fullstack dev",
    "abilities": [{ "name": "TypeScript" }],
    "languages": [{ "languageId": 1, "level": "B2" }],
    "links": [{ "linkString": "https://github.com/jan" }]
  }
  ```

- Przykładowa odpowiedź (sukces):
  ```json
  {
    "status": "success",
    "statusCode": 201,
    "data": {
      "id": 1,
      "name": "Jan",
      "surname": "Kowalski",
      "email": "jan@example.com"
    },
    "message": "User successfuly created"
  }
  ```

- Możliwe błędy:
  - 400 BadRequestException — np. użytkownik już istnieje. AllExceptionsFilter zwróci ErrorResponse z `message` i `error` (zawiera description z wyjątku).
  - 409 — Prisma P2002 (unique constraint), obsłużone przez PrismaClientExceptionFilter.

### 2) Pobieranie użytkownika z relacjami (opcjonalnie)
- Metoda: GET
- Ścieżka: /users/:id
  - Parametr :id to auth0_id (np. `auth0|123`)
- Query params (wszystkie oczekują wartości "true" aby dołączyć relację):
  - abilities=true
  - certificates=true
  - education=true
  - languages=true
  - links=true
  - work=true
  - all=true (dołącza wszystkie relacje)

- Działanie:
  - buildFindOneQuery konstruuje `select` dla Prisma zależnie od query params.
  - Dla relacji: pola powiązane (np. user_id) są omitowane tam, gdzie to zdefiniowano.
  - Dla user_languages zwrócone jest `language` (select: { language: true }).

- Przykładowe wywołanie:
  ```
  GET /users/auth0%7C123?abilities=true&languages=true
  ```

- Przykładowa odpowiedź (sukces):
  ```json
  {
    "status": "success",
    "statusCode": 200,
    "data": {
      "id": 1,
      "auth0_id": "auth0|123",
      "name": "Jan",
      "surname": "Kowalski",
      "phone_number": "+48123123123",
      "email": "jan@example.com",
      "city": "Warszawa",
      "profile_summary": "Fullstack dev",
      "abilities": [{ "id": 1, "name": "TypeScript" }],
      "user_languages": [{ "language": { "id": 1, "name": "English" } }]
    },
    "message": "User found successfuly"
  }
  ```

- Możliwe błędy:
  - 404 NotFoundException — jeżeli użytkownik nie istnieje. ErrorResponse zawiera `message` i `error` (description).

### 3) Usuwanie użytkownika
- Metoda: DELETE
- Ścieżka: /users/:id
  - Parametr :id to auth0_id

- Działanie:
  - Wykonuje `user.delete({ where: { auth0_id: id } })`.
  - Jeżeli rekord nie istnieje, rzucany jest NotFoundException.

- Przykładowa odpowiedź (sukces):
  ```json
  {
    "status": "success",
    "statusCode": 200,
    "data": {
      "id": 1,
      "auth0_id": "auth0|123",
      "email": "jan@example.com"
    },
    "message": "User successfuly deleted"
  }
  ```

- Możliwe błędy:
  - 404 NotFoundException — ErrorResponse z opisem.

---

## Obsługa wyjątków — szczegóły
- AllExceptionsFilter
  - Mapuje HttpException i błędy nie-HTTP do ustandaryzowanego ErrorResponse.
  - Jeżeli wyjątek jest HttpException i ma pole `response.description` (np. BadRequestException(..., { description: '...' })), to to pole trafia do `error` w odpowiedzi.
  - Dla zwykłych Error zwraca stack w `error` (może być użyteczne tylko lokalnie).

- PrismaClientExceptionFilter
  - Wyłapuje Prisma.PrismaClientKnownRequestError.
  - Dla kodu `P2002` (unique constraint) zwraca status 409 i message z wyjątku.
  - Inne kody delegowane do BaseExceptionFilter (domyślne zachowanie).

---

## Wymagania

- [Docker Desktop](https://www.docker.com/)
- [Node.js 18+](https://nodejs.org/)
- [Prisma CLI](https://www.prisma.io/docs) (instaluje się automatycznie przez `npx`)
