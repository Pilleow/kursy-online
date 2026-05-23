# ADR-004: Uwierzytelnianie

## Kontekst

Aplikacja ma cztery role użytkowników. Uwierzytelnianie musi działać dla sesji przeglądarkowych i dla programowego dostępu przez klucze API. Tokeny muszą być odwoływalne natychmiast po wylogowaniu.

---

## Decyzja

**Własne JWT** z krótkotrwałymi tokenami dostępu (15 min, w pamięci klienta) i długotrwałymi tokenami odświeżania (30 dni, cookie HTTP-only). Lista zablokowanych tokenów w Redis. Klucze API jako osobna ścieżka - hashe w DB.

---

## Rozważane alternatywy

### NextAuth.js (Auth.js)
- Najpopularniejsza biblioteka auth dla Next.js, obsługuje OAuth i sesje JWT.
- Dodanie `schoolId`, `role`, `jti` w payloadzie wymaga walki z konwencjami biblioteki.

---

## Uzasadnienie

- Niestandardowy payload JWT: `userId`, `schoolId`, `role`, `jti` i wymaganie odwoływalności sprawiają, że własna implementacja jest prostsza niż adaptacja NextAuth.
- Redis planowany do zarządzania tokenami współdzieli infrastrukturę z kolejką zadań.
- Payload JWT zawiera cały kontekst (`userId`, `schoolId`, `role`) - każde żądanie autentykowane bez zapytania do DB.
- Cookie HTTP-only dla refresh tokena chroni przed XSS.
- Wylogowanie jest natychmiastowe - JTI trafia na listę zablokowanych w Redis.

---

## Trade-offy

- Więcej kodu do utrzymania niż przy bibliotece.
- Logika odświeżania tokenu musi być zaimplementowana po stronie klienta; błąd w niej powoduje niespodziewane wylogowania.
- Lista zablokowanych JTI rośnie - wymaga zadania czyszczącego w tle.
