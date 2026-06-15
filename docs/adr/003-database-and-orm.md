# ADR-003: Baza danych i ORM

## Kontekst

Aplikacja przechowuje dane silnie relacyjne 
- szkoły
- kursy
- moduły
- lekcje
- zapisy
- użytkownicy

oraz dane o zmiennej strukturze. Wielodostępność wymaga izolacji danych między szkołami na poziomie bazy.

---

## Decyzja

**PostgreSQL** jako baza danych, **Prisma** jako ORM. Bloki lekcji jako kolumna JSON.

---

## Rozważane alternatywy

### MySQL / MariaDB
- Szeroko wdrażany.
- Brak Row-Level Security - izolację można wymuszać tylko w kodzie aplikacji, co jest podatne na błędy.

### MongoDB
- Naturalnie obsługuje dokumenty o zmiennym schemacie (dobre dla np. bloków lekcji).
- Brak złączeń - pobranie kursu z modułami, lekcjami i zapisami wymaga wielu zapytań lub denormalizacji.
- Dane relacyjne (zapisy, role, uprawnienia) słabo pasują do modelu dokumentowego.

### Drizzle (alternatywa dla Prisma)
- TypeScript-first, składnia zbliżona do SQL.
- Mniej dojrzały ekosystem.

---

## Uzasadnienie

- PostgreSQL jako jedyna popularna baza open-source dostępna w standardowych stackach webowych obsługuje Row-Level Security (MySQL i MariaDB nadal jej nie mają natywnie; SQL Server i Oracle posiadają odpowiedniki, ale nie są częścią open-source'owego stosu TypeScript).
- Prisma generuje typy TypeScript ze schematu automatycznie.
- `prisma migrate dev` generuje SQL migracji i zaktualizowany klient TypeScript jedną komendą.

---

## Trade-offy

- Prisma nie obsługuje RLS natywnie, polityki bezpieczeństwa muszą być pisane w surowym SQL w plikach migracji.
