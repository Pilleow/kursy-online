# ADR-002: Architektura API

## Kontekst

Projekt wymaga REST API używanego przez własny frontend Next.js oraz przez zewnętrzne systemy (klucze API). 

---

## Decyzja

**Next.js Route Handlers** w tym samym repozytorium co frontend.

---

## Rozważane alternatywy

### Osobny backend Express
- Bardzo popularny, minimalistyczny, duża społeczność.
- Dwa wdrożenia, dwie konfiguracje, zduplikowane typy TypeScript.
- Strony SSR muszą odpytywać API przez sieć zamiast bezpośrednio.

### tRPC
- End-to-end type safety bez generowania kodu, świetny DX w TypeScript.
- Nie obsługuje REST, zewnętrzne systemy integrujące się przez HTTP nie mogą go używać.
- Wymaganie publicznego API z kluczami dostępu wyklucza to rozwiązanie.

---

## Uzasadnienie

- Projekt wymaga publicznego REST API dostępnego z zewnętrznych systemów..
- Route Handlers w Next.js współdzielą typy z frontendem bezpośrednio, bez etapu generowania kodu.
- Komponenty serwerowe mogą odpytywać DB bezpośrednio zamiast przez dodatkowe zapytanie HTTP.
- Jeden serwis Docker uruchamia cały stack.

---

## Trade-offy

- Struktura API jest powiązana ze strukturą folderów. Refaktoryzacja oznacza fizyczne przenoszenie folderów, a nie zmianę jednej linijki w definicji routera.
- Route Handlers mogą urosnąć, jeśli kompozycja middleware nie jest pilnowana.