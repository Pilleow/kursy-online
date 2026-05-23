# ADR-001: Framework aplikacji

## Kontekst

Potrzebujemy frameworka rozwiązującego routing, renderowanie po stronie serwera i obsługę API. Projekt ma trzy różne wymagania renderowania: publiczne strony kursów (SEO), panele zarządzania (interaktywny UI) i REST API dla zewnętrznych systemów.

---

## Decyzja

**Next.js 14 z App Router** - jeden projekt obsługuje SSR, incremental static regeneration, komponenty klienckie i API.

---

## Rozważane alternatywy

### Remix
- Zbudowany na React, dobre wsparcie dla zagnieżdżonych layoutów i formularzy.
- Brak ISR, każda strona renderowana przy każdym żądaniu, co jest kosztowne dla stron kursów z dużym ruchem.
- Mniejszy ekosystem i mniejsza społeczność niż Next.js.

### Czysta aplikacja React + Express
- Express minimalistyczny i popularny, React bez frameworka (np. z Vite) dobrze znany.
- Dwa osobne projekty backend+frontend.
- Publiczne strony kursów byłyby single page application - wyszukiwarki nie indeksują treści poprawnie, a to jest ważne dla SEO.

---

## Uzasadnienie

- Publiczne strony kursów potrzebują incremental static regeneration (`revalidate = 60`) - Next.js obsługuje to natywnie, pozostałe opcje nie.
- App Router pozwala mieszać komponenty serwerowe (bezpośrednie zapytania do DB) z klienckimi w jednym drzewie, nie trzeba duplikować logiki pobierania danych.
- Next.js obsługuje jednocześnie SSR, ISR i Route Handlers API.

---

## Trade-offy

- Granica między komponentem serwerowym a klienckim (`'use client'`) wymaga świadomego zarządzania.
