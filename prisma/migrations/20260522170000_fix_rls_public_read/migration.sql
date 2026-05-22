-- Migration: fix_rls_public_read
-- Date: 2026-06-10
--
-- Supersedes 20260428180000_add_rls_policies (which failed in the DB).
-- Run AFTER: npx prisma migrate resolve --rolled-back 20260428180000_add_rls_policies
--
-- What this does:
--  1. Re-enables Row Level Security on all tenant-scoped tables (idempotent).
--  2. Drops any existing tenant_isolation policies (IF EXISTS = safe to re-run).
--  3. Re-creates all policies using current_setting('app.school_id', true)
--     — the missing_ok=true variant returns NULL instead of throwing when the
--       setting is absent (fixes "Invalid prisma…findMany() invocation" on the
--       public landing page and any other code path without a tenant context).
--  4. The Course policy has a special public-read branch: when app.school_id is
--     not set it allows SELECT on published rows so the landing page works.
--  5. Re-creates the set_tenant_context() helper function.

-- ─── Helper function ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_tenant_context(p_school_id text)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.school_id', p_school_id::text, true);
END;
$$;

-- ─── Course (special: allows public SELECT of published rows) ─────────────────

ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Course";
CREATE POLICY tenant_isolation ON "Course"
  USING (
    CASE
      WHEN current_setting('app.school_id', true) IS NOT NULL
           AND current_setting('app.school_id', true) <> ''
      THEN "schoolId" = current_setting('app.school_id', true)
      ELSE status = 'published'
    END
  );

-- ─── Module ───────────────────────────────────────────────────────────────────

ALTER TABLE "Module" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Module";
CREATE POLICY tenant_isolation ON "Module"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── ModuleAssignment ─────────────────────────────────────────────────────────

ALTER TABLE "ModuleAssignment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ModuleAssignment";
CREATE POLICY tenant_isolation ON "ModuleAssignment"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── Lesson ───────────────────────────────────────────────────────────────────

ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Lesson";
CREATE POLICY tenant_isolation ON "Lesson"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── Quiz ─────────────────────────────────────────────────────────────────────

ALTER TABLE "Quiz" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Quiz";
CREATE POLICY tenant_isolation ON "Quiz"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── QuizQuestion ─────────────────────────────────────────────────────────────

ALTER TABLE "QuizQuestion" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "QuizQuestion";
CREATE POLICY tenant_isolation ON "QuizQuestion"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── QuizAttempt ──────────────────────────────────────────────────────────────

ALTER TABLE "QuizAttempt" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "QuizAttempt";
CREATE POLICY tenant_isolation ON "QuizAttempt"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── Homework ─────────────────────────────────────────────────────────────────

ALTER TABLE "Homework" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Homework";
CREATE POLICY tenant_isolation ON "Homework"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── HomeworkQuestion ─────────────────────────────────────────────────────────

ALTER TABLE "HomeworkQuestion" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "HomeworkQuestion";
CREATE POLICY tenant_isolation ON "HomeworkQuestion"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── HomeworkSubmission ───────────────────────────────────────────────────────

ALTER TABLE "HomeworkSubmission" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "HomeworkSubmission";
CREATE POLICY tenant_isolation ON "HomeworkSubmission"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── Enrollment ───────────────────────────────────────────────────────────────

ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Enrollment";
CREATE POLICY tenant_isolation ON "Enrollment"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── LessonProgress ───────────────────────────────────────────────────────────

ALTER TABLE "LessonProgress" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "LessonProgress";
CREATE POLICY tenant_isolation ON "LessonProgress"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── QAQuestion ───────────────────────────────────────────────────────────────

ALTER TABLE "QAQuestion" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "QAQuestion";
CREATE POLICY tenant_isolation ON "QAQuestion"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── Certificate ──────────────────────────────────────────────────────────────

ALTER TABLE "Certificate" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Certificate";
CREATE POLICY tenant_isolation ON "Certificate"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── Coupon ───────────────────────────────────────────────────────────────────

ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Coupon";
CREATE POLICY tenant_isolation ON "Coupon"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── ApiKey ───────────────────────────────────────────────────────────────────

ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ApiKey";
CREATE POLICY tenant_isolation ON "ApiKey"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── Job ──────────────────────────────────────────────────────────────────────

ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Job";
CREATE POLICY tenant_isolation ON "Job"
  USING ("schoolId" = current_setting('app.school_id', true));

-- ─── SchoolMembership ─────────────────────────────────────────────────────────

ALTER TABLE "SchoolMembership" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "SchoolMembership";
CREATE POLICY tenant_isolation ON "SchoolMembership"
  USING ("schoolId" = current_setting('app.school_id', true));
