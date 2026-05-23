# ADR-005: Kolejka zadań

## Kontekst

Kilka operacji trwa zbyt długo na jedno żądanie HTTP:
- generowanie certyfikatu PDF, 
- transkodowanie wideo, 
- duplikowanie kursów, 
- wysyłanie e-maili (np. powiadamiających o oczekujących pytaniach Q&A). 

Serwer musi przyjąć żądanie, dodać zadanie do kolejki i zwrócić ID zadania do odpytywania.

---

## Decyzja

**BullMQ** jako biblioteka kolejki zadań na **Redis**. Osobny proces roboczy jako drugi serwis Docker. Klienci odpytują API `GET jobs/:jobId`.

---

## Rozważane alternatywy

### PostgreSQL jako kolejka (tabela z odpytywaniem)
- Brak dodatkowej infrastruktury - PostgreSQL jest wymagany przez aplikację.
- Regularne odpytywanie tabeli generuje niepotrzebne obciążenie DB przy wzroście liczby zadań.

### Worker Threads Node.js
- Brak zewnętrznych zależności.
- Zadania nie są utrwalane, restart procesu traci wszystkie zadania w toku.

---

## Uzasadnienie

- Generowanie PDF i transkodowanie wideo wymagają trwałości zadań i automatycznych prób.
- Redis jest już planowany do zarządzania tokenami JWT - BullMQ nie dodaje nowej infrastruktury.
- Wzorzec polling (`GET /jobs/:jobId`) jest wystarczający dla czasów zadań rzędu sekund.
- BullMQ automatycznie ponawia nieudane zadania z wykładniczym backoffem.
- Awaria workera nie wpływa na serwer webowy - jest to osobny proces.

---

## Trade-offy

- Stack wymaga dwóch uruchomionych procesów: serwer Next.js i worker.
- Docker Compose staje się bardziej złożony; dwa serwisy współdzielą połączenia do Redis i DB.
