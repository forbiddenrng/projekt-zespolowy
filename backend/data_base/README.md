# CV Database (Prisma + PostgreSQL + Docker)

Projekt przedstawia relacyjną bazę danych stworzoną w **Prisma ORM** oraz uruchamianą w kontenerze **PostgreSQL (Docker)**.  
Struktura bazy została zaprojektowana z myślą o przechowywaniu danych użytkownika (CV/Portfolio), w tym edukacji, doświadczenia, języków, certyfikatów i umiejętności technicznych.

---

## Wymagania

- [Docker Desktop](https://www.docker.com/)
- [Node.js 18+](https://nodejs.org/)
- [Prisma CLI](https://www.prisma.io/docs) (instaluje się automatycznie przez `npx`)

---

## Uruchomienie projektu

### 1. Sklonuj repozytorium

```bash
git clone https://github.com/forbiddenrng/projekt-zespolowy.git
cd cv-database/prisma
```

### 2. Uruchom bazę danych w Dockerze

```bash
docker-compose up -d
```

### 3. Sprawdż połączenie i strukturę Prisma

```bash
npx prisma validate
```

### 4. Utwórz bazę danych i wykonaj migracje

```bash
npx prisma migrate dev --name init
```

### 5. Otwórz GUI bazy danych(Prisma Studio)

```bash
npx prisma studio
```

## Struktura Projektu

```bash
data_base/
 ├── generated/                # wygenerowany Prisma Client
 ├── prisma/
 │    ├── migrations/          # pliki migracji
 │    ├── .env                 # zmienne środowiskowe (DATABASE_URL)
 │    └── schema.prisma        # definicja modeli bazy danych
 ├── docker-compose.yml         # konfiguracja kontenera PostgreSQL
 └── README.md                 # dokumentacja projektu
```

Technologie: Prisma ORM, PostgreSQL, Docker, Node.js
