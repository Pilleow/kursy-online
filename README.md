# EduFlow

Platforma SaaS do sprzedaży i prowadzenia kursów online.  
Każda szkoła działa w izolowanej przestrzeni i zarządza własnymi instruktorami, kursami, studentami oraz certyfikatami.

**Projekt zaliczeniowy - Projektowanie Aplikacji Internetowych**  
Uniwersytet Jagielloński, Wydział Fizyki, Astronomii i Informatyki Stosowanej 2025/2026

---

## Uruchomienie

### Zalecany sposób (infrastruktura Docker + aplikacja lokalnie)

Aplikacja Next.js i worker BullMQ uruchamiane są lokalnie (hot reload), a infrastruktura (PostgreSQL, Redis, MinIO) w kontenerach.

```bash
# 1. Uruchom infrastrukturę + migracje + seed
docker compose up db redis minio minio-init db-init

# 2. Skopiuj zmienne środowiskowe
cp .env.example .env

# 3. Zainstaluj zależności
npm install

# 4. Terminal 1 — serwer deweloperski Next.js
npm run dev

# 5. Terminal 2 — worker BullMQ
npm run worker
```

| Serwis | Adres |
|---|---|
| Aplikacja | http://localhost:3000 |
| MinIO Console | http://localhost:9001 |

### Dane testowe (seed)

Po uruchomieniu dostępne są następujące konta:

| Rola | Email | Hasło | URL logowania |
|---|---|---|---|
| System Admin | `sysadmin@ngv.dev` | `changeme` | `/system/login` |
| School Admin | `a@e.com` | `password123` | `/login` |
| Instructor | `i@e.com` | `password123` | `/login` |
| Student | `s1@e.com`, `s2@e.com`, `s3@e.com` | `password123` | `/login` |

### Pełny Docker Compose (bez hot reload)

```bash
docker compose up --build
```

Uruchamia cały stack włącznie z aplikacją i workerem jako kontenery produkcyjne. Migracje i seed są ładowane automatycznie.

---

## Architektura

### Stos technologiczny

| Warstwa         | Technologia                              | Uzasadnienie                                                                                              |
|-----------------|------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| Język           | TypeScript (Node.js)                     | Jeden język dla backendu i frontendu typy współdzielone bez generowania kodu                              |
| Frontend / SSR  | Next.js 14, App Router, React, Tailwind CSS | Incremental static regeneration dla publicznych stron kursów (SEO), Server Components dla zapytań bez HTTP |
| REST API        | Next.js Route Handlers                   | Monorepo, brak duplikacji typów                                                      |
| Baza danych     | PostgreSQL 16 + Prisma ORM               | Row-Level Security dla izolacji szkół, migracje                                                           |
| Uwierzytelnianie | Własne JSON Web Token + blocklist        | Niestandardowy payload {`userId`, `schoolId`, `role`, `jti`}, natychmiastowe wylogowanie przez JTI blocklist |
| Cache           | Redis                                    | JTI blocklist + metadane kolejki BullMQ                                                                   |
| Kolejka zadań   | BullMQ na Redis                          | Generowanie certyfikatów PDF, przetwarzanie wideo, powiadomienia e-mail, duplikacja kursów                |
| Walidacja       | Zod                                      | Schematy definiowane raz, importowane przez backend i frontend, wyprowadzanie typów TypeScript            |
| Pliki           | MinIO (dev) / AWS S3 (prod)              | Upload bezpośrednio z przeglądarki przez presigned URL, serwer nie jest w ścieżce uploadu                 |
| Multi-tenancy   | Izolacja w DB                            | Każda szkoła widzi tylko swoje zasoby (kursy, instruktorów, studentów, certyfikaty itd.)                  |

---

## Decyzje architektoniczne ADR

Pełna dokumentacja w [`docs/adr/`](docs/adr/) - 8 wpisów.

---

## Spełnienie wymagań

### Wymagania obowiązkowe (R1–R6)

| ID | Wymaganie | Status | Realizacja                                         |
|---|---|---|----------------------------------------------------|
| R1 | Backend API | ✅ | REST API                                           |
| R2 | Baza danych | ✅ | PostgreSQL + Prisma, migracje w `prisma/migrations/` |
| R3 | Frontend | ✅ | Next.js 14 App Router                              |
| R4 | Autentykacja | ✅ | JWT (access+refresh) + API keys                    |
| R5 | Konteneryzacja | ✅ | Docker Compose dla infrastruktury; `docker compose up --build` uruchamia pełny stack |
| R6 | Repozytorium | ✅ | Publiczne repo, historia commitów, ten README      |

### Elementy dodatkowe

| Element | Realizacja                                              |
|---|---------------------------------------------------------|
| **Cache** | Redis                                                   |
| **Task queue** | BullMQ                                                  |
| **Walidacja danych** | Zod                                                     |
| **Multi-tenancy** | PostgreSQL RLS + middleware                             |
| **Seed data** | `prisma/seed.ts`, użycie: `npx prisma db seed`          |
| **Health check** | `GET /api/health`, używany w docker-compose healthcheck |

---
