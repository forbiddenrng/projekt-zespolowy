# User Service - Dokumentacja

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

- src/main.ts - entrypoint aplikacji
- src/users/
  - users.controller.ts - definicje endpointów
  - users.service.ts - logika tworzenia/pobierania/usuwania użytkowników
  - dto/\*.ts - DTO używane do walidacji/transferu danych (create-user.dto.ts, create-ability.dto.ts, itd.)
- src/database/database.service.ts - wrapper Prisma (używany przez UsersService)
- src/interceptors/response/response.interceptor.ts - mapuje odpowiedzi kontrolerów do formatu SuccessResponse
- src/filters/all-exceptions-filter/all-exceptions.filter.ts - globalny filtr wyjątków (ErrorResponse)
- src/prisma-client-exception/prisma-client-exception.filter.ts - obsługa znanych błędów Prisma (np. P2002)

## Uruchomienie

- Dev: `sh npm run start:dev`
- Production build: `npm run build` i `node dist/main.js`

---

## API - dostępne endpointy

Wszystkie ścieżki zaczynają się od `/users`.

Formaty ogólne:

- Sukces (ResponseInterceptor) - SuccessResponse:
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
- Błąd (AllExceptionsFilter) - ErrorResponse:
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
- Prisma-known error (np. P2002 - unique constraint) obsługiwany przez [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts) zwraca co najmniej:
  ```json
  {
    "statusCode": 409,
    "message": "Unique constraint failed on the fields: (...)"
  }
  ```

### Uwaga: nagłówek x-user i autoryzacja

- Gateway wstrzykuje nagłówek `x-user` jako string JSON: `JSON.stringify({ "id": "auth0|..." })`. Middleware parsuje nagłówek i zapisuje `req.userId`. Implementacja: [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts).
- Middleware jest rejestrowany dla ścieżek użytkownika w [`UsersModule`](user-service/src/users/users.module.ts).
- ValidationPipe jest włączony w bootstrapie aplikacji: [`src/main.ts`](user-service/src/main.ts).
- Response mapping: [`src/interceptors/response/response.interceptor.ts`](user-service/src/interceptors/response/response.interceptor.ts).
- Globalne mapowanie błędów Prisma: [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts).
- Globalny filtr wyjątków: [`AllExceptionsFilter`](user-service/src/filters/all-exceptions-filter/all-exceptions.filter.ts).

### 1) Tworzenie użytkownika

- Metoda: POST
- Ścieżka: /users
- Header: `x-user: JSON.stringify({ "id": "auth0|..." })` - jeśli header jest obecny, kontroler nadpisuje `auth0Id` z body wartością z nagłówka. Z tego powodu DTO akceptuje `auth0Id` jako opcjonalne; serwis i kontroler gwarantują przypisanie rekordu do właściwego Auth0 id.
- Zmiana wykonana: kontroler używa `req.userId` (wartość ustawiona przez [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts)) i przypisuje do `createUserDto.auth0Id` przed wywołaniem [`UsersService.create`](user-service/src/users/users.service.ts). Implementacja: [`UsersController.create`](user-service/src/users/users.controller.ts), [`UsersService.create`](user-service/src/users/users.service.ts).

- Body (JSON) - pola akceptowane przez [`CreateUserDto`](user-service/src/users/dto/create-user.dto.ts) i używane w buildCreateData:

  ```json
  {
    "auth0Id": "string", // OPTIONAL - nadpisywane z nagłówka jeżeli header istnieje
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
  - Kontroler sprawdza `req.userId`; jeżeli brak -> 400 Bad Request.
  - `createUserDto.auth0Id` jest nadpisywane `req.userId`.
  - [`UsersService.create`](user-service/src/users/users.service.ts) buduje `Prisma.UserCreateInput` (mapowanie pól) i tworzy rekord.
  - Walidacja DTO wykonywana przez [`ValidationPipe`](user-service/src/main.ts).
- Przykładowa odpowiedź (sukces): SuccessResponse statusCode 201 (zwraca pola wybrane w serwisie).

- Możliwe błędy:
  - 400 BadRequest - brak parsowalnego `x-user` lub walidacja DTO (ValidationPipe) - zobacz [`src/main.ts`](user-service/src/main.ts).
  - 409 Conflict - Prisma P2002 (unique constraint) -> mapowane przez [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts).

### 1a) Aktualizacja profilu użytkownika

- PATCH /users/me
  - Opis: aktualizuje dane profilu aktualnego użytkownika (nazwa, nazwisko, telefon, miasto, opis). Email nie może być zmieniony.
  - Header: `x-user: JSON.stringify({ "id": "auth0|..." })`
  - Body (JSON, dowolne pola z [`UpdateUserDto`](user-service/src/users/dto/update-user.dto.ts)):
    ```json
    {
      "name": "Nowe Imię",
      "surname": "Nowe Nazwisko",
      "phoneNumber": "+48600000000",
      "city": "Kraków",
      "profileSummary": "Nowy opis profilu zawierający co najmniej 20 znaków"
    }
    ```
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i zaktualizowanym użytkownikiem.
  - Możliwe błędy:
    - 400 BadRequest - brak `x-user`, walidacja DTO (np. profileSummary < 20 znaków, niepoprawny numer telefonu)
    - 404 NotFound - użytkownik nie istnieje
  - Powiązane: [`UsersService.updateCurrentUserProfile`](user-service/src/users/users.service.ts)

### 2) Pobieranie aktualnie zalogowanego użytkownika (me) oraz publiczne pobranie po auth0Id

- GET /users/me
  - Opis: Zwraca profil aktualnie zalogowanego użytkownika; `req.userId` jest brany z nagłówka `x-user`.
  - Query params: abilities/certificates/education/languages/links/work/all (wartość "true" dołącza relację).
  - Kontroler: [`UsersController.findMe`](user-service/src/users/users.controller.ts) -> serwis [`UsersService.findOne`](user-service/src/users/users.service.ts).

- GET /users/:id
  - Opis: Publiczne pobranie użytkownika po auth0Id (np. `auth0|123`) - identyczne query params jak powyżej.
  - Kontroler: [`UsersController.findOne`](user-service/src/users/users.controller.ts) -> serwis [`UsersService.findOne`](user-service/src/users/users.service.ts).

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
  - Implementacja: [`UsersService.remove`](user-service/src/users/users.service.ts) - usuwa `user` po `auth0_id` (zwraca 404 jeśli brak).

### 5) Relacje (work-experience, education, links, certificates, abilities, languages)

Schemat dla każdej relacji:

- GET `/users/<resource>` - dla bieżącego użytkownika (x-user)
- GET `/users/:id/<resource>` - publicznie po auth0Id
- PUT `/users/<resource>` - bulk merge:
  - elementy z `id`: UPDATE
  - elementy bez `id`: CREATE
  - elementy nieprzesłane: DELETE
  - pusta lista `[]`: usuwa wszystkie
- Zwracane `metadata`: `{ created, updated, deleted }`

### 5a) Work experience (doświadczenie) - endpointy

- GET /users/work-experiences
  - Opis: Zwraca listę doświadczeń zalogowanego użytkownika na podstawie nagłówka `x-user`.
  - Header: x-user (jak powyżej)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą obiektów doświadczenia.
  - Powiązane: [`UsersService.listWorkExperiencesForCurrentUser`](user-service/src/users/users.service.ts)

- GET /users/:id/work-experiences
  - Opis: Publiczne pobranie doświadczeń użytkownika po auth0Id (przydatne dla innych serwisów).
  - Path param: :id - auth0_id (np. `auth0|123`)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą obiektów doświadczenia.
  - Powiązane: [`UsersService.listWorkExperiencesByAuth0Id`](user-service/src/users/users.service.ts)

- PUT /users/work-experiences - bulk merge pełnej listy doświadczeń
  - Header: `x-user`
  - Body (DTO: [`BulkWorkExperienceDto`](src/users/dto/bulk-work-experience.dto.ts)):
    - `workExperiences`: tablica obiektów `{ id?, companyName, position, description, beginDate, endDate? }`
  - Strategia: z `id` -> UPDATE, bez `id` -> CREATE, nieprzesłane -> DELETE, `[]` -> usuń wszystkie
  - Odpowiedź: `statusCode: 200`, `metadata: { created, updated, deleted }`
  - Kontroler: [`WorkExperienceController.bulkMerge`](src/users/work-experience.controller.ts) -> Serwis: [`UsersService.mergeWorkExperiences`](src/users/users.service.ts)

Uwaga dotycząca dat i walidacji:

- Pola `beginDate` i `endDate` muszą być w formacie ISO (np. "2023-01-01T00:00:00.000Z") i nie mogą być w przyszłości - walidowane przez [`MaxNow`](user-service/src/validators/max-now.validator.ts). Niepoprawne daty zwrócą 400 Bad Request z komunikatem walidacji.

Błędy i zachowanie

- 400 BadRequest - np. brak parsowalnego nagłówka `x-user` lub niepoprawne pola (walidacja DTO). ValidationPipe jest włączony w [`src/main.ts`](user-service/src/main.ts).
- 404 NotFound - rekord nie istnieje lub nie należy do zalogowanego użytkownika.
- 409 Conflict - naruszenie unikalności (Prisma P2002), obsługiwane przez [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts).

---

### 5b) Education (wykształcenie) - endpointy

- GET /users/education
  - Opis: Zwraca listę wpisów wykształcenia zalogowanego użytkownika (id z nagłówka `x-user`).
  - Header: x-user (jak powyżej)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą wpisów.
  - Powiązane: [`UsersService.listEducationForCurrentUser`](user-service/src/users/users.service.ts)

- GET /users/:id/education
  - Opis: Publiczne pobranie wpisów wykształcenia po auth0Id (dla innych serwisów).
  - Path param: :id - auth0_id (np. `auth0|123`) (URL-encode pipe -> `%7C`)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą wpisów.
  - Powiązane: [`UsersService.listEducationByAuth0Id`](user-service/src/users/users.service.ts)

- PUT /users/education - bulk merge pełnej listy edukacji
  - Header: `x-user`
  - Body (DTO: [`BulkEducationDto`](src/users/dto/bulk-education.dto.ts)):
    - `education`: tablica `{ id?, schoolName, major, degree, beginDate, endDate? }`
  - Strategia jak wyżej (UPDATE/CREATE/DELETE)
  - Odpowiedź: `statusCode: 200`, `metadata: { created, updated, deleted }`
  - Kontroler: [`EducationController.bulkMerge`](src/users/education.controller.ts) -> Serwis: [`UsersService.mergeEducation`](src/users/users.service.ts)

Uwaga dotycząca dat i walidacji:

- Pola `beginDate` i `endDate` muszą być w formacie ISO (np. "2018-10-01T00:00:00.000Z") i nie mogą być w przyszłości - walidowane przez [`MaxNow`](user-service/src/validators/max-now.validator.ts). Niepoprawne daty zwrócą 400 Bad Request z komunikatem walidacji.

Błędy i zachowanie

- 400 BadRequest - np. brak parsowalnego nagłówka `x-user` lub niepoprawne pola (walidacja DTO). ValidationPipe jest włączony w [`src/main.ts`](user-service/src/main.ts).
- 404 NotFound - rekord nie istnieje lub nie należy do zalogowanego użytkownika.
- 409 Conflict - naruszenie unikalności (Prisma P2002), obsługiwane przez [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts).

---

### 5c) Links - endpointy

- GET /users/links
  - Opis: Zwraca listę linków zalogowanego użytkownika (id z nagłówka `x-user`).
  - Header: x-user (jak powyżej)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą obiektów.
  - Powiązane: [`UsersService.listLinksForCurrentUser`](user-service/src/users/users.service.ts)

- GET /users/:id/links
  - Opis: Publiczne pobranie linków użytkownika po auth0Id (dla innych serwisów).
  - Path param: `:id` - auth0_id (np. `auth0|123`) (URL-encode pipe -> `%7C`)
  - Odpowiedź: SuccessResponse ze statusCode 200 i tablicą obiektów.
  - Powiązane: [`UsersService.listLinksByAuth0Id`](user-service/src/users/users.service.ts)

- PUT /users/links - bulk merge pełnej listy linków
  - Header: `x-user`
  - Body (DTO: [`BulkLinksDto`](src/users/dto/bulk-link.dto.ts)):
    - `links`: tablica `{ id?, linkString }`
  - Strategia jak wyżej (UPDATE/CREATE/DELETE)
  - Odpowiedź: `statusCode: 200`, `metadata: { created, updated, deleted }`
  - Kontroler: [`LinksController.bulkMerge`](src/users/links.controller.ts) -> Serwis: [`UsersService.mergeLinks`](src/users/users.service.ts)

Uwagi:

- Pola DTO są walidowane przez klasy w [`user-service/src/users/dto/`](user-service/src/users/dto/). Błędy walidacji zwrócą 400 Bad Request.

---

### 5d) Certificates (certyfikaty) - endpointy

- GET /users/certificates
  - Opis: Zwraca listę certyfikatów zalogowanego użytkownika (id z nagłówka `x-user`).
  - Header: x-user (jak powyżej)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą obiektów.
  - Powiązane: [`UsersService.listCertificatesForCurrentUser`](user-service/src/users/users.service.ts)

- GET /users/:id/certificates
  - Opis: Publiczne pobranie certyfikatów użytkownika po auth0Id (dla innych serwisów).
  - Path param: `:id` - auth0_id (np. `auth0|123`) (URL-encode pipe -> `%7C`)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą wpisów.
  - Powiązane: [`UsersService.listCertificatesByAuth0Id`](user-service/src/users/users.service.ts)

- PUT /users/certificates - bulk merge pełnej listy certyfikatów
  - Header: `x-user`
  - Body (DTO: [`BulkCertificatesDto`](src/users/dto/bulk-certificate.dto.ts)):
    - `certificates`: tablica `{ id?, name, issuer, certificationDate }`
  - Strategia jak wyżej (UPDATE/CREATE/DELETE)
  - Odpowiedź: `statusCode: 200`, `metadata: { created, updated, deleted }`
  - Kontroler: [`CertificatesController.bulkMerge`](src/users/certificates.controller.ts) -> Serwis: [`UsersService.mergeCertificates`](src/users/users.service.ts)

Uwaga dotycząca dat i walidacji:

- Pole `certificationDate` musi być w formacie ISO (np. "2022-06-30T00:00:00.000Z") i nie może być w przyszłości - walidowane przez [`MaxNow`](user-service/src/validators/max-now.validator.ts). Niepoprawne daty zwrócą 400 Bad Request z komunikatem walidacji.

Błędy i zachowanie:

- 400 BadRequest - np. brak parsowalnego nagłówka `x-user` lub niepoprawne pola (walidacja DTO). ValidationPipe jest włączony w [`src/main.ts`](user-service/src/main.ts).
- 404 NotFound - rekord nie istnieje lub nie należy do zalogowanego użytkownika.
- 409 Conflict - naruszenie unikalności (Prisma P2002), obsługiwane przez [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts).

---

### 5e) Abilities (umiejętności) - endpointy

- GET /users/abilities
  - Opis: Zwraca listę umiejętności zalogowanego użytkownika (id z nagłówka `x-user`).
  - Header: x-user (jak powyżej)
  - Odpowiedź (sukces): SuccessResponse ze statusCode 200 i tablicą obiektów.
  - Powiązane: [`UsersService.listAbilitiesForCurrentUser`](user-service/src/users/users.service.ts)

- GET /users/:id/abilities
  - Opis: Publiczne pobranie umiejętności użytkownika po auth0Id (dla innych serwisów).
  - Path param: `:id` - auth0_id (np. `auth0|123`) (URL-encode pipe -> `%7C`)
  - Odpowiedź: SuccessResponse ze statusCode 200 i tablicą obiektów.
  - Powiązane: [`UsersService.listAbilitiesByAuth0Id`](user-service/src/users/users.service.ts)

- PUT /users/abilities - bulk merge pełnej listy umiejętności
  - Header: `x-user`
  - Body (DTO: [`BulkAbilitiesDto`](src/users/dto/bulk-ability.dto.ts)):
    - `abilities`: tablica `{ id?, name }`
  - Strategia jak wyżej (UPDATE/CREATE/DELETE)
  - Odpowiedź: `statusCode: 200`, `metadata: { created, updated, deleted }`
  - Kontroler: [`AbilitiesController.bulkMerge`](src/users/abilities.controller.ts) -> Serwis: [`UsersService.mergeAbilities`](src/users/users.service.ts)

Uwagi:

- Pola DTO są walidowane przez klasy w [`user-service/src/users/dto/`](user-service/src/users/dto/). Błędy walidacji zwrócą 400 Bad Request.

---

### 5f) Languages (języki) - endpointy

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
  - Path param: `:id` - auth0_id (np. `auth0|123`) (URL-encode pipe -> `%7C`)
  - Odpowiedź: SuccessResponse ze statusCode 200 i tablicą obiektów (z dołączonym `language`).
  - Powiązane: [`UsersService.listLanguagesByAuth0Id`](user-service/src/users/users.service.ts)

- PUT /users/languages - bulk merge pełnej listy języków użytkownika (tabela pośrednia user_languages)
  - Header: `x-user`
  - Body (DTO: [`BulkLanguagesDto`](src/users/dto/bulk-language.dto.ts)):
    - `languages`: tablica `{ id?, languageId, level }`
  - Strategia jak wyżej (UPDATE/CREATE/DELETE); weryfikacja istnienia `languageId`
  - Odpowiedź: `statusCode: 200`, `metadata: { created, updated, deleted }`
  - Kontroler: [`LanguagesController.bulkMerge`](src/users/languages.controller.ts) -> Serwis: [`UsersService.mergeLanguages`](src/users/users.service.ts)

Uwagi:

- `languageId` odnosi się do tabeli [`Languages`](user-service/prisma/schema.prisma) - sprawdzane w serwisie.
- Błędy walidacji DTO zwrócą 400 Bad Request. Unikalność pary (user_id, language_id) jest narzucona w schema Prisma i powoduje P2002 (409) jeśli użytkownik doda dwa razy ten sam język.

---

## Obsługa wyjątków - szczegóły

- AllExceptionsFilter
  - Mapuje HttpException i błędy nie-HTTP do ustandaryzowanego ErrorResponse.
  - Jeżeli wyjątek jest HttpException i ma pole `response.description` (np. BadRequestException(..., { description: '...' })), to to pole trafia do `error` w odpowiedzi.
  - Dla zwykłych Error zwraca stack tylko lokalnie - w produkcji stack nie jest ujawniany (kontrola przez NODE_ENV).
  - Implementacja: [`AllExceptionsFilter`](user-service/src/filters/all-exceptions-filter/all-exceptions.filter.ts)

- PrismaClientExceptionFilter
  - Wyłapuje błędy typu `Prisma.PrismaClientKnownRequestError` i mapuje najczęściej spotykane kody na odpowiednie statusy HTTP:
    - P2002 - unique constraint -> 409 Conflict
    - P2025 - record(s) not found -> 404 Not Found
    - P2003 - foreign key / constraint violation -> 400 Bad Request
    - P1001 - database connection / engine error -> 503 Service Unavailable
  - Inne kody są delegowane do domyślnego `BaseExceptionFilter`.
  - Implementacja: [`PrismaClientExceptionFilter`](user-service/src/prisma-client-exception/prisma-client-exception.filter.ts)
  - Filtr jest rejestrowany globalnie w [`src/main.ts`](user-service/src/main.ts)

- Rejestracja i bezpieczne logowanie
  - PrismaClientExceptionFilter zarejestrowany globalnie zapobiega "przeciekowi" surowych błędów Prisma do klienta.
  - AllExceptionsFilter zwraca stack tylko w środowisku non-production dla ułatwienia debugowania.
  - Sprawdź konfigurację bazy w [`prisma/schema.prisma`](user-service/prisma/schema.prisma)

- Autoryzacja i nagłówek x-user
  - Gateway wstrzykuje nagłówek `x-user` na podstawie tokena JWT - implementacja w [`gateway/index.js`](gateway/index.js)
  - Middleware parsuje `x-user` i ustawia `req.userId` w serwisie: [`UserFromHeaderMiddleware`](user-service/src/middleware/user-from-header.middleware.ts)

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
