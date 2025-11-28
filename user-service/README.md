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
- Prisma-known error (np. P2002 — unique constraint) obsługiwany przez [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts) zwraca co najmniej:
  ```json
  {
    "statusCode": 409,
    "message": "Unique constraint failed on the fields: (...)"
  }
  ```

Uwaga dotycząca nagłówka x-user i autoryzacji

- Gateway wstrzykuje nagłówek `x-user` jako string JSON: `JSON.stringify({ "id": "auth0|..." })`. Middleware parsuje nagłówek i zapisuje `req.userId`. Implementacja: [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts).
- Middleware jest rejestrowany dla ścieżek użytkownika w [`UsersModule`](user-service/src/users/users.module.ts).
- ValidationPipe jest włączony w bootstrapie aplikacji: [`src/main.ts`](user-service/src/main.ts).
- Response mapping: [`src/interceptors/response/response.interceptor.ts`](user-service/src/interceptors/response/response.interceptor.ts).
- Globalne mapowanie błędów Prisma: [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts).
- Globalny filtr wyjątków: [`AllExceptionsFilter`](user-service/src/filters/all-exceptions-filter/all-exceptions.filter.ts).

### 1) Tworzenie użytkownika

- Metoda: POST
- Ścieżka: /users
- Header: `x-user: JSON.stringify({ "id": "auth0|..." })` — jeśli header jest obecny, kontroler nadpisuje `auth0Id` z body wartością z nagłówka. Z tego powodu DTO akceptuje `auth0Id` jako opcjonalne; serwis i kontroler gwarantują przypisanie rekordu do właściwego Auth0 id.
- Zmiana wykonana: kontroler używa `req.userId` (wartość ustawiona przez [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts)) i przypisuje do `createUserDto.auth0Id` przed wywołaniem [`UsersService.create`](user-service/src/users/users.service.ts). Implementacja: [`UsersController.create`](user-service/src/users/users.controller.ts), [`UsersService.create`](user-service/src/users/users.service.ts).

- Body (JSON) — pola akceptowane przez [`CreateUserDto`](user-service/src/users/dto/create-user.dto.ts) i używane w buildCreateData:

  ```json
  {
    "auth0Id": "string", // OPTIONAL — nadpisywane z nagłówka jeżeli header istnieje
    "email": "string",
    "phoneNumber": "string",
    "name": "string",
    "surname": "string",
    "city": "string",
    "profileSummary": "string", // OPTIONAL
    "abilities": [ {"name":"string"} ],
    "certificates": [ { "name":"string", "issuer":"string", "certificationDate":"Date" } ],
    "education": [ { "schoolName":"string", "major":"string", "degree":"string", "beginDate":"ISO", "endDate":"ISO?" } ],
    "links": [ {"linkString":"string"} ],
    "workExperience": [ { "companyName":"string", "position":"string", "beginDate":"ISO", "endDate":"ISO?", "description":"string" } ],
    "languages": [ { "languageId": number, "level":"string" } ]
  }
  ```

- Działanie:
  - Kontroler sprawdza `req.userId`; jeżeli brak → 400 Bad Request.
  - `createUserDto.auth0Id` jest nadpisywane `req.userId`.
  - [`UsersService.create`](user-service/src/users/users.service.ts) buduje `Prisma.UserCreateInput` (mapowanie pól) i tworzy rekord.
  - Walidacja DTO wykonywana przez [`ValidationPipe`](user-service/src/main.ts).
- Przykładowa odpowiedź (sukces): SuccessResponse statusCode 201 (zwraca pola wybrane w serwisie).

- Możliwe błędy:
  - 400 BadRequest — brak parsowalnego `x-user` lub walidacja DTO (ValidationPipe) — zobacz [`src/main.ts`](user-service/src/main.ts).
  - 409 Conflict — Prisma P2002 (unique constraint) → mapowane przez [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts).

### 2) Pobieranie aktualnie zalogowanego użytkownika (me) oraz publiczne pobranie po auth0Id

- GET /users/me
  - Opis: Zwraca profil aktualnie zalogowanego użytkownika; `req.userId` jest brany z nagłówka `x-user`.
  - Query params: abilities/certificates/education/languages/links/work/all (wartość "true" dołącza relację).
  - Kontroler: [`UsersController.findMe`](user-service/src/users/users.controller.ts) → serwis [`UsersService.findOne`](user-service/src/users/users.service.ts).

- GET /users/:id
  - Opis: Publiczne pobranie użytkownika po auth0Id (np. `auth0|123`) — identyczne query params jak powyżej.
  - Kontroler: [`UsersController.findOne`](user-service/src/users/users.controller.ts) → serwis [`UsersService.findOne`](user-service/src/users/users.service.ts).

- Implementacja zapytań wykorzystuje `buildFindOneQuery` w [`UsersService`](user-service/src/users/users.service.ts) (konstruuje `select` dla Prisma).

### 3) Sprawdzanie istnienia profilu

- GET /users/profile-exists
  - Opis: Sprawdza, czy istnieje profil aktualnego użytkownika (id z `x-user`).
  - Kontroler: [`UsersController.findMyProfileExists`](user-service/src/users/users.controller.ts).
  - Serwis: [`UsersService.profileExistsForCurrentUser`](user-service/src/users/users.service.ts).

- GET /users/:id/profile-exists
  - Opis: Publiczne sprawdzenie istnienia profilu po auth0Id (dla innych serwisów).
  - Kontroler: [`UsersController.findProfileExistsByAuth0Id`](user-service/src/users/users.controller.ts).
  - Serwis: [`UsersService.profileExistsByAuth0Id`](user-service/src/users/users.service.ts).

### 4) Usuwanie użytkownika

- DELETE /users/:id
  - Parametr :id to auth0_id.
  - Implementacja: [`UsersService.remove`](user-service/src/users/users.service.ts) — usuwa `user` po `auth0_id` (zwraca 404 jeśli brak).

### 5) CRUD relacji (work-experience, education, links, certificates, abilities, languages)

- Wszystkie endpointy tworzenia/aktualizacji dla relacji używają schematu:
  - POST /users/<resource> — dla aktualnego użytkownika (nagłówek `x-user` parsowany przez [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts)).
  - GET /users/<resource> — listuje zasoby aktualnego użytkownika (z nagłówka).
  - GET /users/:id/<resource> — publiczne listowanie po auth0Id (dla innych serwisów).
  - PATCH /users/<resource>/:id i DELETE /users/<resource>/:id — operacje nad zasobami przypisanymi do aktualnego użytkownika (weryfikacja user_id w serwisie).

### 5a) Work experience (doświadczenie) — endpointy

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

### 5b) Education (wykształcenie) — endpointy

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

### 5c) Links — endpointy

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

### 5d) Certificates (certyfikaty) — endpointy

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

### 5e) Abilities (umiejętności) — endpointy

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

### 5f) Languages (języki) — endpointy

- POST /users/languages
  - Opis: Dodaje wpis języka do profilu zalogowanego użytkownika (poziom, odniesienie do tabeli Languages).
  - Header: `x-user: JSON.stringify({ "id": "auth0|..." })` — parsowany przez [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts).
  - Body (JSON, zgodne z [`LanguageDto`](user-service/src/users/dto/create-language.dto.ts)):
    ```json
    {
      "languageId": 1,
      "level": "B2"
    }
    ```
  - Odpowiedź (sukces): SuccessResponse ze statusCode 201 i dodanym obiektem (rekord z `user_languages`).
  - Powiązane implementacje:
    - Kontroler: [`LanguagesController`](user-service/src/users/languages.controller.ts)
    - Serwis: [`UsersService.addLanguage`](user-service/src/users/users.service.ts)

- GET /users/languages
  - Opis: Zwraca listę wpisów języków zalogowanego użytkownika (id z nagłówka `x-user`).
  - Header: x-user
  - Odpowiedź: SuccessResponse ze statusCode 200 i tablicą obiektów (z dołączonym `language`).
  - Powiązane: [`UsersService.listLanguagesForCurrentUser`](user-service/src/users/users.service.ts)

- GET /users/languages/all
  - Opis: Zwraca listę wszystkich języków z bazy danych.
  - Odpowiedź: SuccessResponse ze statusCode 200 i tablicą obiektów.
  - Powiązane: [`UsersService.getAllLanguages`](user-service/src/users/users.service.ts)

- GET /users/:id/languages
  - Opis: Publiczne pobranie wpisów języków użytkownika po auth0Id (dla innych serwisów).
  - Path param: `:id` — auth0_id (np. `auth0|123`) (URL-encode pipe -> `%7C`)
  - Odpowiedź: SuccessResponse ze statusCode 200 i tablicą obiektów (z dołączonym `language`).
  - Powiązane: [`UsersService.listLanguagesByAuth0Id`](user-service/src/users/users.service.ts)

- PATCH /users/languages/:id
  - Opis: Aktualizuje wpis języka należący do zalogowanego użytkownika (poziom lub zmiana `languageId`).
  - Header: x-user
  - Path param: `:id` — identyfikator rekordu `user_languages` (liczba)
  - Body: `UpdateLanguageDto` (np. `{ "level": "C1" }`) — definicja: [`UpdateLanguageDto`](user-service/src/users/dto/update-language.dto.ts)
  - Odpowiedź: SuccessResponse ze statusCode 200 i zaktualizowanym obiektem.
  - Powiązane: [`UsersService.updateLanguage`](user-service/src/users/users.service.ts)

- DELETE /users/languages/:id
  - Opis: Usuwa wpis języka należący do zalogowanego użytkownika.
  - Header: x-user
  - Path param: `:id` — identyfikator rekordu `user_languages` (liczba)
  - Odpowiedź: SuccessResponse ze statusCode 200 i usuniętym obiektem.
  - Powiązane: [`UsersService.removeLanguage`](user-service/src/users/users.service.ts)

Uwagi:

- `languageId` odnosi się do tabeli [`Languages`](user-service/prisma/schema.prisma) — sprawdzane w serwisie.
- Błędy walidacji DTO zwrócą 400 Bad Request. Unikalność pary (user_id, language_id) jest narzucona w schema Prisma i powoduje P2002 (409) jeśli użytkownik doda dwa razy ten sam język.

Powiązane pliki/symbole:

- [`LanguagesController`](user-service/src/users/languages.controller.ts)
- [`LanguageDto`](user-service/src/users/dto/create-language.dto.ts)
- [`UpdateLanguageDto`](user-service/src/users/dto/update-language.dto.ts)
- [`UsersService.listLanguagesForCurrentUser`](user-service/src/users/users.service.ts)
- [`UsersService.listLanguagesByAuth0Id`](user-service/src/users/users.service.ts)
- [`UsersService.addLanguage`](user-service/src/users/users.service.ts)
- [`UsersService.updateLanguage`](user-service/src/users/users.service.ts)
- [`UsersService.removeLanguage`](user-service/src/users/users.service.ts)
- [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts)
- [`UsersModule`](user-service/src/users/users.module.ts)
- Gateway: [`gateway/index.js`](gateway/index.js)
- Schema: [user-service/prisma/schema.prisma](user-service/prisma/schema.prisma) (models `Languages` and `User_Languages`)

---

## Obsługa wyjątków — szczegóły

- AllExceptionsFilter
  - Mapuje HttpException i błędy nie-HTTP do ustandaryzowanego ErrorResponse.
  - Jeżeli wyjątek jest HttpException i ma pole `response.description` (np. BadRequestException(..., { description: '...' })), to to pole trafia do `error` w odpowiedzi.
  - Dla zwykłych Error zwraca stack tylko lokalnie — w produkcji stack nie jest ujawniany (kontrola przez NODE_ENV).
  - Implementacja: [`AllExceptionsFilter`](user-service/src/filters/all-exceptions-filter/all-exceptions.filter.ts)

- PrismaClientExceptionFilter
  - Wyłapuje błędy typu `Prisma.PrismaClientKnownRequestError` i mapuje najczęściej spotykane kody na odpowiednie statusy HTTP:
    - P2002 — unique constraint -> 409 Conflict
    - P2025 — record(s) not found -> 404 Not Found
    - P2003 — foreign key / constraint violation -> 400 Bad Request
    - P1001 — database connection / engine error -> 503 Service Unavailable
  - Inne kody są delegowane do domyślnego `BaseExceptionFilter`.
  - Implementacja: [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts)
  - Filtr jest rejestrowany globalnie w [`src/main.ts`](user-service/src/main.ts)

- Rejestracja i bezpieczne logowanie
  - PrismaClientExceptionFilter zarejestrowany globalnie zapobiega "przeciekowi" surowych błędów Prisma do klienta.
  - AllExceptionsFilter zwraca stack tylko w środowisku non-production dla ułatwienia debugowania.
  - Sprawdź konfigurację bazy w [`prisma/schema.prisma`](user-service/prisma/schema.prisma)

- Autoryzacja i nagłówek x-user
  - Gateway wstrzykuje nagłówek `x-user` na podstawie tokena JWT — implementacja w [`gateway/index.js`](gateway/index.js)
  - Middleware parsuje `x-user` i ustawia `req.userId` w serwisie: [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts)

- Dobre praktyki
  - Nie ujawniać szczegółów stacka w produkcji.
  - Mapować znane kody Prisma na czytelne statusy HTTP (jak powyżej).
  - Logować szczegóły błędów po stronie serwera (centralny logger) i zwracać klientowi tylko niezbędne informacje.

- Powiązane pliki/symbole:
  - [`AllExceptionsFilter`](user-service/src/filters/all-exceptions-filter/all-exceptions.filter.ts)
  - [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts)
  - [`src/main.ts`](user-service/src/main.ts)
  - [`prisma/schema.prisma`](user-service/prisma/schema.prisma)
  - [`gateway/index.js`](gateway/index.js)
  - [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts)

---

## Wymagania

- [Docker Desktop](https://www.docker.com/)
- [Node.js 18+](https://nodejs.org/)
- [Prisma CLI](https://www.prisma.io/docs) (instaluje się automatycznie przez `npx`)
