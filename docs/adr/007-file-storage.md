# ADR-007: Przechowywanie plików

## Kontekst

Aplikacja przechowuje trzy rodzaje plików: 
1. miniaturki kursów i awatary, 
2. wideo lekcji (do paru GB), 
3. certyfikaty PDF. 

Przesyłanie dużych plików przez serwer aplikacji marnuje pamięć i przepustowość.

---

## Decyzja

**MinIO** (dev, Docker) i **AWS S3** (produkcja) - to samo API S3. Pliki przesyłane bezpośrednio z przeglądarki przez **presigned URL**. Certyfikaty: prywatne, serwowane przez krótkotrwałe presigned URL do pobierania.

---

## Rozważane alternatywy

### Lokalny system plików serwera
- Zero konfiguracji, prosta implementacja.
- Pliki tracone przy zastępowaniu kontenera.
- Nie działa przy wielu instancjach za load balancerem.

---

## Uzasadnienie

- Presigned URL eliminuje serwer z ścieżki przesyłania; duże pliki wideo trafiają bezpośrednio z przeglądarki do storage.
- MinIO implementuje to samo API co S3 - przełączenie na produkcję to TYLKO zmiana zmiennych środowiskowych.
- Certyfikaty PDF są domyślnie prywatne - student dostaje presigned URL wygasający po krótkim czasie.

---

## Trade-offy

- Upload wymaga dwóch kroków: żądanie presigned URL z serwera, potem upload bezpośrednio do storage.
