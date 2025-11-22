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
  - dto/\*.ts — DTO używane do walidacji/transferu danych (create-user.dto.ts, create-ability.dto.ts, itd.)
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
    "data": {
      /* payload lub null */
    },
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

### Work experience (doświadczenie) — endpointy

- POST /users/work-experiences
  - Opis: Dodaje wpis doświadczenia zawodowego do profilu zalogowanego użytkownika.
  - Header: x-user: JSON.stringify({ "id": "auth0|..." }) (string) — nagłówek generowany przez gateway ([gateway/index.js](gateway/index.js)).
  - Body (JSON, zgodne z [`WorkExperienceDto`](user-service/src/users/dto/create-work-experience.dto.ts)):
    ```json
    {
      "companyName": "Firma S.A.",
      "position": "Senior Developer",
      "beginDate": "2023-01-01T00:00:00.000Z",
      "endDate": "2024-01-01T00:00:00.000Z", // opcjonalne
      "description": "Opis stanowiska..."
    }
    ```
  - Odpowiedź (sukces): SuccessResponse ze statusCode 201 i dodanym obiektem doświadczenia (zwracane pola zgodne z modelem DB).
  - Powiązane implementacje:
    - Kontroler: [`WorkExperienceController`](user-service/src/users/work-experience.controller.ts)
    - Serwis: [`UsersService.addWorkExperience`](user-service/src/users/users.service.ts)

- GET /users/work-experiences
  - Opis: Zwraca listę doświadczeń zalogowanego użytkownika na podstawie nagłówka `x-user`.
  - Header: x-user (jak powyżej)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą obiektów doświadczenia.
  - Powiązane: [`UsersService.listWorkExperiencesForCurrentUser`](user-service/src/users/users.service.ts)

- GET /users/:id/work-experiences
  - Opis: Publiczne pobranie doświadczeń użytkownika po auth0Id (przydatne dla innych serwisów).
  - Path param: :id — auth0_id (np. `auth0|123`)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą obiektów doświadczenia.
  - Powiązane: [`UsersService.listWorkExperiencesByAuth0Id`](user-service/src/users/users.service.ts)

- PATCH /users/work-experiences/:id
  - Opis: Aktualizuje istniejący wpis doświadczenia należący do zalogowanego użytkownika.
  - Header: x-user (jak powyżej)
  - Path param: :id — identyfikator rekordu doświadczenia (liczba)
  - Body (JSON, dowolne pola dostępne w [`UpdateWorkExperienceDto`](user-service/src/users/dto/update-work-experience.dto.ts)):
    ```json
    {
      "position": "Lead Developer",
      "endDate": "2024-12-31T00:00:00.000Z"
    }
    ```
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i zaktualizowanym obiektem.
  - Powiązane: [`UsersService.updateWorkExperience`](user-service/src/users/users.service.ts)

- DELETE /users/work-experiences/:id
  - Opis: Usuwa wpis doświadczenia należący do zalogowanego użytkownika.
  - Header: x-user (jak powyżej)
  - Path param: :id — identyfikator rekordu doświadczenia (liczba)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i usuniętym obiektem.
  - Powiązane: [`UsersService.removeWorkExperience`](user-service/src/users/users.service.ts)

Uwaga dotycząca dat i walidacji:

- Pola `beginDate` i `endDate` muszą być w formacie ISO (np. "2023-01-01T00:00:00.000Z") i nie mogą być w przyszłości — walidowane przez [`MaxNow`](user-service/src/validators/max-now.validator.ts). Niepoprawne daty zwrócą 400 Bad Request z komunikatem walidacji.

Błędy i zachowanie

- 400 BadRequest — np. brak parsowalnego nagłówka `x-user` lub niepoprawne pola (walidacja DTO). ValidationPipe jest włączony w [`src/main.ts`](user-service/src/main.ts).
- 404 NotFound — rekord nie istnieje lub nie należy do zalogowanego użytkownika.
- 409 Conflict — naruszenie unikalności (Prisma P2002), obsługiwane przez [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts).

Powiązane pliki/symbole:

- [`WorkExperienceController`](user-service/src/users/work-experience.controller.ts)
- [`WorkExperienceDto`](user-service/src/users/dto/create-work-experience.dto.ts)
- [`UpdateWorkExperienceDto`](user-service/src/users/dto/update-work-experience.dto.ts)
- [`UsersService`](user-service/src/users/users.service.ts)
- [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts)
- [`UsersModule`](user-service/src/users/users.module.ts)
- Gateway: [`gateway/index.js`](gateway/index.js)

---

### Education (wykształcenie) — endpointy

- POST /users/education
  - Opis: Dodaje wpis wykształcenia do profilu zalogowanego użytkownika.
  - Header: x-user: JSON.stringify({ "id": "auth0|..." }) (string) — nagłówek generowany przez gateway ([gateway/index.js](gateway/index.js)) i parsowany przez [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts).
  - Body (JSON, zgodne z [`EducationDto`](user-service/src/users/dto/create-education.dto.ts)):
    ```json
    {
      "schoolName": "Uniwersytet X",
      "major": "Informatyka",
      "degree": "Inżynier",
      "beginDate": "2018-10-01T00:00:00.000Z",
      "endDate": "2022-06-30T00:00:00.000Z" // opcjonalne
    }
    ```
  - Odpowiedź (sukces): SuccessResponse ze statusCode 201 i dodanym obiektem (pola zgodne z modelem DB `Education`).
  - Powiązane implementacje:
    - Kontroler: [`EducationController`](user-service/src/users/education.controller.ts)
    - Serwis: [`UsersService.addEducation`](user-service/src/users/users.service.ts)

- GET /users/education
  - Opis: Zwraca listę wpisów wykształcenia zalogowanego użytkownika (id z nagłówka `x-user`).
  - Header: x-user (jak powyżej)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą wpisów.
  - Powiązane: [`UsersService.listEducationForCurrentUser`](user-service/src/users/users.service.ts)

- GET /users/:id/education
  - Opis: Publiczne pobranie wpisów wykształcenia po auth0Id (dla innych serwisów).
  - Path param: :id — auth0_id (np. `auth0|123`) (URL-encode pipe -> `%7C`)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą wpisów.
  - Powiązane: [`UsersService.listEducationByAuth0Id`](user-service/src/users/users.service.ts)

- PATCH /users/education/:id
  - Opis: Aktualizuje wpis wykształcenia należący do zalogowanego użytkownika.
  - Header: x-user (jak powyżej)
  - Path param: :id — identyfikator rekordu Education (liczba)
  - Body: dowolne pola z [`UpdateEducationDto`](user-service/src/users/dto/update-education.dto.ts):
    ```json
    {
      "degree": "Magister",
      "endDate": "2023-06-30T00:00:00.000Z"
    }
    ```
  - Odpowiedź: SuccessResponse ze statusCode 200 i zaktualizowanym obiektem.
  - Powiązane: [`UsersService.updateEducation`](user-service/src/users/users.service.ts)

- DELETE /users/education/:id
  - Opis: Usuwa wpis wykształcenia należący do zalogowanego użytkownika.
  - Header: x-user (jak powyżej)
  - Path param: :id — identyfikator rekordu Education (liczba)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i usuniętym obiektem.
  - Powiązane: [`UsersService.removeEducation`](user-service/src/users/users.service.ts)

Uwaga dotycząca dat i walidacji:

- Pola `beginDate` i `endDate` muszą być w formacie ISO (np. "2018-10-01T00:00:00.000Z") i nie mogą być w przyszłości — walidowane przez [`MaxNow`](user-service/src/validators/max-now.validator.ts). Niepoprawne daty zwrócą 400 Bad Request z komunikatem walidacji.

Błędy i zachowanie

- 400 BadRequest — np. brak parsowalnego nagłówka `x-user` lub niepoprawne pola (walidacja DTO). ValidationPipe jest włączony w [`src/main.ts`](user-service/src/main.ts).
- 404 NotFound — rekord nie istnieje lub nie należy do zalogowanego użytkownika.
- 409 Conflict — naruszenie unikalności (Prisma P2002), obsługiwane przez [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts).

Powiązane pliki/symbole:

- [`EducationController`](user-service/src/users/education.controller.ts)
- [`EducationDto`](user-service/src/users/dto/create-education.dto.ts)
- [`UpdateEducationDto`](user-service/src/users/dto/update-education.dto.ts)
- [`UsersService`](user-service/src/users/users.service.ts)
- [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts)
- [`UsersModule`](user-service/src/users/users.module.ts)
- Gateway: [`gateway/index.js`](gateway/index.js)

---

### Links — endpointy

- POST /users/links
  - Opis: Dodaje wpis z linkiem (np. GitHub, LinkedIn) do profilu zalogowanego użytkownika.
  - Header: `x-user: JSON.stringify({ "id": "auth0|..." })` (string) — nagłówek generowany przez gateway ([gateway/index.js](gateway/index.js)) i parsowany przez [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts).
  - Body (JSON, zgodne z [`LinkDto`](user-service/src/users/dto/create-link.dto.ts)):
    ```json
    {
      "linkString": "https://github.com/jan"
    }
    ```
  - Odpowiedź (sukces): SuccessResponse ze statusCode 201 i dodanym obiektem `Link`.
  - Powiązane implementacje:
    - Kontroler: [`LinksController`](user-service/src/users/links.controller.ts)
    - Serwis: [`UsersService.addLink`](user-service/src/users/users.service.ts)

- GET /users/links
  - Opis: Zwraca listę linków zalogowanego użytkownika (id z nagłówka `x-user`).
  - Header: x-user (jak powyżej)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą obiektów.
  - Powiązane: [`UsersService.listLinksForCurrentUser`](user-service/src/users/users.service.ts)

- GET /users/:id/links
  - Opis: Publiczne pobranie linków użytkownika po auth0Id (dla innych serwisów).
  - Path param: `:id` — auth0_id (np. `auth0|123`) (URL-encode pipe -> `%7C`)
  - Odpowiedź: SuccessResponse ze statusCode 200 i tablicą obiektów.
  - Powiązane: [`UsersService.listLinksByAuth0Id`](user-service/src/users/users.service.ts)

- PATCH /users/links/:id
  - Opis: Aktualizuje wpis linku należący do zalogowanego użytkownika.
  - Header: x-user (jak powyżej)
  - Path param: `:id` — identyfikator rekordu Link (liczba)
  - Body: `UpdateLinkDto` (np. `{ "linkString": "https://..." }`) — definicja: [`UpdateLinkDto`](user-service/src/users/dto/update-link.dto.ts)
  - Odpowiedź: SuccessResponse ze statusCode 200 i zaktualizowanym obiektem.
  - Powiązane: [`UsersService.updateLink`](user-service/src/users/users.service.ts)

- DELETE /users/links/:id
  - Opis: Usuwa wpis linku należący do zalogowanego użytkownika.
  - Header: x-user (jak powyżej)
  - Path param: `:id` — identyfikator rekordu Link (liczba)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i usuniętym obiektem.
  - Powiązane: [`UsersService.removeLink`](user-service/src/users/users.service.ts)

Uwagi:

- Pola DTO są walidowane przez klasy w [`user-service/src/users/dto/`](user-service/src/users/dto/). Błędy walidacji zwrócą 400 Bad Request.
- Wszystkie endpointy tworzenia/aktualizacji pobierają id użytkownika z nagłówka i przypisują rekord do wewnętrznego `user.id` (logika w [`UsersService`](user-service/src/users/users.service.ts)).

Powiązane pliki/symbole (otwórz w edytorze):

- [`LinksController`](user-service/src/users/links.controller.ts)
- [`LinkDto`](user-service/src/users/dto/create-link.dto.ts)
- [`UpdateLinkDto`](user-service/src/users/dto/update-link.dto.ts)
- [`addLink`, `listLinksForCurrentUser`, `listLinksByAuth0Id`, `updateLink`, `removeLink`](user-service/src/users/users.service.ts)
- [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts) — parsowanie `x-user`
- [`UsersModule`](user-service/src/users/users.module.ts) — rejestracja kontrolerów
- Gateway: [`gateway/index.js`](gateway/index.js)

---

### Certificates (certyfikaty) — endpointy

- POST /users/certificates
  - Opis: Dodaje wpis certyfikatu do profilu zalogowanego użytkownika.
  - Header: `x-user: JSON.stringify({ "id": "auth0|..." })` (string) — nagłówek generowany przez gateway ([gateway/index.js](gateway/index.js)) i parsowany przez [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts).
  - Body (JSON, zgodne z [`CertificateDto`](user-service/src/users/dto/create-certificate.dto.ts)):
    ```json
    {
      "name": "Certyfikat X",
      "issuer": "Issuer Y",
      "certificationDate": "2022-06-30T00:00:00.000Z"
    }
    ```
  - Odpowiedź (sukces): SuccessResponse ze statusCode 201 i dodanym obiektem `Certificate`.
  - Powiązane implementacje:
    - Kontroler: [`CertificatesController`](user-service/src/users/certificates.controller.ts)
    - Serwis: [`UsersService.addCertificate`](user-service/src/users/users.service.ts)

- GET /users/certificates
  - Opis: Zwraca listę certyfikatów zalogowanego użytkownika (id z nagłówka `x-user`).
  - Header: x-user (jak powyżej)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą obiektów.
  - Powiązane: [`UsersService.listCertificatesForCurrentUser`](user-service/src/users/users.service.ts)

- GET /users/:id/certificates
  - Opis: Publiczne pobranie certyfikatów użytkownika po auth0Id (dla innych serwisów).
  - Path param: `:id` — auth0_id (np. `auth0|123`) (URL-encode pipe -> `%7C`)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą wpisów.
  - Powiązane: [`UsersService.listCertificatesByAuth0Id`](user-service/src/users/users.service.ts)

- PATCH /users/certificates/:id
  - Opis: Aktualizuje wpis certyfikatu należący do zalogowanego użytkownika.
  - Header: x-user (jak powyżej)
  - Path param: `:id` — identyfikator rekordu Certificate (liczba)
  - Body: `UpdateCertificateDto` (np. `{ "issuer": "Nowy Issuer" }`) — definicja: [`UpdateCertificateDto`](user-service/src/users/dto/update-certificate.dto.ts)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i zaktualizowanym obiektem.
  - Powiązane: [`UsersService.updateCertificate`](user-service/src/users/users.service.ts)

- DELETE /users/certificates/:id
  - Opis: Usuwa wpis certyfikatu należący do zalogowanego użytkownika.
  - Header: x-user (jak powyżej)
  - Path param: `:id` — identyfikator rekordu Certificate (liczba)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i usuniętym obiektem.
  - Powiązane: [`UsersService.removeCertificate`](user-service/src/users/users.service.ts)

Uwaga dotycząca dat i walidacji:

- Pole `certificationDate` musi być w formacie ISO (np. "2022-06-30T00:00:00.000Z") i nie może być w przyszłości — walidowane przez [`MaxNow`](user-service/src/validators/max-now.validator.ts). Niepoprawne daty zwrócą 400 Bad Request z komunikatem walidacji.

Błędy i zachowanie:

- 400 BadRequest — np. brak parsowalnego nagłówka `x-user` lub niepoprawne pola (walidacja DTO). ValidationPipe jest włączony w [`src/main.ts`](user-service/src/main.ts).
- 404 NotFound — rekord nie istnieje lub nie należy do zalogowanego użytkownika.
- 409 Conflict — naruszenie unikalności (Prisma P2002), obsługiwane przez [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts).

Powiązane pliki/symbole:

- [`CertificatesController`](user-service/src/users/certificates.controller.ts)
- [`CertificateDto`](user-service/src/users/dto/create-certificate.dto.ts)
- [`UpdateCertificateDto`](user-service/src/users/dto/update-certificate.dto.ts)
- [`UsersService.addCertificate`](user-service/src/users/users.service.ts)
- [`UsersService.listCertificatesForCurrentUser`](user-service/src/users/users.service.ts)
- [`UsersService.listCertificatesByAuth0Id`](user-service/src/users/users.service.ts)
- [`UsersService.updateCertificate`](user-service/src/users/users.service.ts)
- [`UsersService.removeCertificate`](user-service/src/users/users.service.ts)
- [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts)
- [`UsersModule`](user-service/src/users/users.module.ts)
- Gateway: [`gateway/index.js`](gateway/index.js)

---

// ...existing code...

### Abilities (umiejętności) — endpointy

- POST /users/abilities
  - Opis: Dodaje wpis umiejętności (np. "TypeScript") do profilu zalogowanego użytkownika.
  - Header: `x-user: JSON.stringify({ "id": "auth0|..." })` (string) — nagłówek generowany przez gateway ([gateway/index.js](gateway/index.js)) i parsowany przez [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts).
  - Body (JSON, zgodne z [`AbilityDto`](user-service/src/users/dto/create-ability.dto.ts)):
    ```json
    {
      "name": "TypeScript"
    }
    ```
  - Odpowiedź (sukces): SuccessResponse ze statusCode 201 i dodanym obiektem `Abilities`.
  - Powiązane implementacje:
    - Kontroler: [`AbilitiesController`](user-service/src/users/abilities.controller.ts)
    - Serwis: [`UsersService.addAbility`](user-service/src/users/users.service.ts)

- GET /users/abilities
  - Opis: Zwraca listę umiejętności zalogowanego użytkownika (id z nagłówka `x-user`).
  - Header: x-user (jak powyżej)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą obiektów.
  - Powiązane: [`UsersService.listAbilitiesForCurrentUser`](user-service/src/users/users.service.ts)

- GET /users/:id/abilities
  - Opis: Publiczne pobranie umiejętności użytkownika po auth0Id (dla innych serwisów).
  - Path param: `:id` — auth0_id (np. `auth0|123`) (URL-encode pipe -> `%7C`)
  - Odpowiedź: SuccessResponse ze statusCode 200 i tablicą obiektów.
  - Powiązane: [`UsersService.listAbilitiesByAuth0Id`](user-service/src/users/users.service.ts)

- PATCH /users/abilities/:id
  - Opis: Aktualizuje wpis umiejętności należący do zalogowanego użytkownika.
  - Header: x-user (jak powyżej)
  - Path param: `:id` — identyfikator rekordu Abilities (liczba)
  - Body: `UpdateAbilityDto` (np. `{ "name": "Advanced TypeScript" }`) — definicja: [`UpdateAbilityDto`](user-service/src/users/dto/update-ability.dto.ts)
  - Odpowiedź: SuccessResponse ze statusCode 200 i zaktualizowanym obiektem.
  - Powiązane: [`UsersService.updateAbility`](user-service/src/users/users.service.ts)

- DELETE /users/abilities/:id
  - Opis: Usuwa wpis umiejętności należący do zalogowanego użytkownika.
  - Header: x-user (jak powyżej)
  - Path param: `:id` — identyfikator rekordu Abilities (liczba)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i usuniętym obiektem.
  - Powiązane: [`UsersService.removeAbility`](user-service/src/users/users.service.ts)

Uwagi:

- Pola DTO są walidowane przez klasy w [`user-service/src/users/dto/`](user-service/src/users/dto/). Błędy walidacji zwrócą 400 Bad Request.

Powiązane pliki/symbole (otwórz w edytorze):

- [`AbilitiesController`](user-service/src/users/abilities.controller.ts)
- [`AbilityDto`](user-service/src/users/dto/create-ability.dto.ts)
- [`UpdateAbilityDto`](user-service/src/users/dto/update-ability.dto.ts)
- [`addAbility`](user-service/src/users/users.service.ts)
- [`listAbilitiesForCurrentUser`](user-service/src/users/users.service.ts)
- [`listAbilitiesByAuth0Id`](user-service/src/users/users.service.ts)
- [`updateAbility`](user-service/src/users/users.service.ts)
- [`removeAbility`](user-service/src/users/users.service.ts)
- [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts)
- [`UsersModule`](user-service/src/users/users.module.ts)
- Gateway: [`gateway/index.js`](gateway/index.js)

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
