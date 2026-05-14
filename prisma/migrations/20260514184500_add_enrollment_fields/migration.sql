-- Migration: add_enrollment_fields
-- Date: 2026-05-30 13:00
--
-- Adds accessDurationDays to Course (nullable — null means unlimited access)
-- and expiresAt to Enrollment (computed at enroll time from accessDurationDays).

ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "accessDurationDays" INTEGER;

ALTER TABLE "Enrollment"
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
