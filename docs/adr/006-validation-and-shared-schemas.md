# ADR-006: Walidacja danych

---

## Kontekst

Każdy endpoint API musi walidować dane wejściowe. Formularze na frontendzie potrzebują tych samych reguł. Pisanie reguł dwa razy prowadzi do rozbieżności między backendem a frontendem.

---

## Decyzja

**Zod** - schematy definiowane raz, importowane przez backend i frontend. Typy TypeScript wyprowadzane z schematu.

---

## Rozważane alternatywy

### class-validator
- Wymaga instancji klasy do walidacji, co nie pasuje do funkcyjnego stylu Next.js Route Handlers i React.

### Ręczna walidacja (if/throw)
- Brak zależności.
- Każdy endpoint ma własne sprawdzeni; niespójne kształty błędów, liniowy koszt utrzymania.

---

## Uzasadnienie

- Zod wyprowadza typy TypeScript bezpośrednio ze schematu - jeden obiekt jest i schematem walidacji, i definicją typu.
- Resolver sprawia, że błędy walidacji formularza są identyczne z błędami API.
- Schemat to jedyne źródło prawdy dla kształtu żądania.
- Zmiana reguły walidacji w jednym miejscu automatycznie działa po obu stronach.

---

## Trade-offy

- Złożone warunkowe reguły (np. A wymagane tylko gdy B = X) stają się rozwlekłe w składni Zod.
