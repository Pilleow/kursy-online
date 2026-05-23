# ADR-000: Język backendu

## Kontekst

Wybór języka backendu determinuje cały ekosystem projektu. Każda interaktywna aplikacja webowa wymaga JavaScript po stronie przeglądarki - pytanie brzmi, czy backend będzie w innym języku, czy ujednolicamy stos.

---

## Decyzja

**Node.js + TypeScript** - jeden język dla backendu i frontendu.

---

## Rozważane alternatywy

### PHP (Laravel)
- Bardzo popularny, dojrzały ekosystem, wbudowane migracje i auth.
- PHP + JavaScript.

### Django (Python)
- Wbudowany admin.
- Python + JavaScript.
- Dobry do przetwarzania danych, ale nie do bogatego interaktywnego UI.

### Spring (Java)
- Dojrzały, silnie typowany, dobry do bardzo dużych systemów.
- Duży narzut konfiguracyjny (klasy, adnotacje, dependency injection) nieproporcjonalny do skali.
- Java + JavaScript.

---

## Uzasadnienie

- Projekt wymaga bogatego UI, JavaScript w przeglądarce jest nieunikniony niezależnie od backendu.
- Node.js eliminuje podwójny ekosystem: typy żądań/odpowiedzi API i schematy walidacji definiujemy raz i importujemy po obu stronach.
- TypeScript po obu stronach oznacza, że kompilator wykrywa rozbieżności między backendem a frontendem w czasie kompilacji.

---

## Trade-offy
- Node.js jest jednowątkowy, zadania obliczeniowe (PDF, transkodowanie) blokują pętlę zdarzeń i wymagają osobnego procesu.
- TypeScript wymaga dodatkowej konfiguracji i dyscypliny - błędy typów itd.
