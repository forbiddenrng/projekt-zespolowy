# 🤖 AI Service

AI Service to szybki i nowoczesny serwis napisany w **Pythonie** przy użyciu frameworka **FastAPI**. Główną funkcjonalnością jest **generowanie dokumentów, m.in. CV**, za pomocą API OpenAI. Projekt jest zorganizowany w sposób modułowy, co ułatwia pracę zespołową, testowanie i rozbudowę o kolejne funkcjonalności oparte na AI.

---

## Wymagania

- **Python 3.12+**
- Dostęp do **API OpenAI** (klucz musi być zapisany w pliku `.env`).

---

## Instalacja i Uruchomienie

Poniższe kroki pomogą w szybkim uruchomieniu serwisu lokalnie.

### 1. Konfiguracja Środowiska

Skopiuj plik `.env.example` i uzupełnij klucz API OpenAI:

```bash
cp .env.example .env
```

Przykład zawartości pliku .env:

```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
APP_NAME=AI Service
```

### 2. Środowisko Wirtualne

Utwórz i aktywuj dedykowane środowisko wirtualne:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
```

### 3. Instalacja Zależności

Zainstaluj wszystkie wymagane biblioteki z pliku requirements.txt:

```bash
pip install -r requirements.txt
```

(Alternatywnie, ręczna instalacja kluczowych bibliotek: )

```bash
pip install fastapi "uvicorn[standard]" openai pydantic-settings python-dotenv
```

### 4. Uruchomienie Serwisu

Uruchom aplikację za pomocą serwera ASGI Uvicorn:

```bash
python -m uvicorn app.main:app --reload
```

Serwis będzie dostępny pod adresem: http://127.0.0.1:8000

### 5. Dokumentacja API

Interaktywna dokumentacja Swagger UI jest dostępna pod adresem:

http://127.0.0.1:8000/docs

## Struktura Projektu

Projekt opiera się na przejrzystym podziale na warstwy: API (endpointy), Clients (zewnętrzne usługi), Core (konfiguracja) i Services (logika biznesowa).

```bash
ai-service/
│
├─ .venv/               # Środowisko wirtualne (ignorowane przez Git)
├─ app/
│  ├─ api/
│  │  └─ v1/
│  │     ├─ cv.py       # Endpointy do generowania CV
│  │     └─ router.py   # Główny router API v1
│  ├─ clients/
│  │  └─ openai_client.py  # Klasa klienta OpenAI i funkcja generate_text
│  ├─ core/
│  │  └─ config.py        # Konfiguracja aplikacji, wczytywanie .env
│  ├─ services/
│  │  ├─ cv_service.py    # Logika biznesowa generowania CV
│  │  └─ prompt_builder.py # Moduł do budowania promptów
│  └─ main.py             # Główny plik uruchamiający FastAPI
├─ .env.example          # Wzór pliku środowiskowego
├─ requirements.txt      # Lista zależności
└─ README.md             # Ten plik
```

## Kluczowe Komponenty

Plik,Opis,Użyte biblioteki/Techniki
app/core/config.py,Definicja ustawień aplikacji. Wczytuje zmienne środowiskowe z .env za pomocą Pydantic Settings.,"pydantic-settings, python-dotenv"
app/clients/openai_client.py,Inicjalizacja klienta OpenAI i abstrakcja wywołania do API (generate_text).,openai
app/services/cv_service.py,Logika biznesowa generowania CV. Wykorzystuje prompt_builder i openai_client.,"Python, Logika"
app/api/v1/cv.py,Endpoint FastAPI /cv/generate (POST). Używa Dependency Injection do wstrzyknięcia klienta OpenAI i serwisu.,"FastAPI, Dependency Injection"
app/main.py,Główna aplikacja FastAPI. Rejestruje routery (np. /v1).,FastAPI

## Użyte Biblioteki

Biblioteka,Cel
FastAPI,"Nowoczesny, szybki framework webowy do tworzenia API."
Uvicorn,"Serwer ASGI, niezbędny do uruchomienia aplikacji FastAPI."
OpenAI,Oficjalny klient do komunikacji z API OpenAI.
Pydantic Settings,"Zarządzanie konfiguracją i zmiennymi środowiskowymi, walidacja ustawień."
Python-dotenv,Narzędzie do wczytywania zmiennych ze ścieżki .env.

## Przykładowe Wywołanie
