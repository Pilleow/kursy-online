-- Migration: add_rls_policies
-- Date: 2026-04-27 22:12
--
-- Enables PostgreSQL Row-Level Security (RLS) on every tenant-scoped table so
-- that each row is only visible to queries running in the context of the owning
-- school.  Isolation is achieved by comparing the table's school_id column
-- against the session-local GUC app.school_id, which must be set before any
-- tenant query via set_tenant_context().
--
-- Tables covered: Course, Module, ModuleAssignment, Lesson, Quiz, QuizQuestion,
--   QuizAttempt, Homework, HomeworkQuestion, HomeworkSubmission, Enrollment,
--   LessonProgress, QAQuestion, Certificate, Coupon, ApiKey, Job,
--   SchoolMembership.
--
-- Tables intentionally excluded (not tenant-scoped): Plan, School, User.
--
-- Usage from application code (Prisma raw query before each request):
--   SELECT set_tenant_context('<school-uuid>');

-- ─── Helper function ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_tenant_context(p_school_id text)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.school_id', p_school_id::text, true); -- true = LOCAL (transaction-scoped)
END;
$$;

-- ─── Course ───────────────────────────────────────────────────────────────────

ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Course"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── Module ───────────────────────────────────────────────────────────────────

ALTER TABLE "Module" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Module"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── ModuleAssignment ─────────────────────────────────────────────────────────

ALTER TABLE "ModuleAssignment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "ModuleAssignment"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── Lesson ───────────────────────────────────────────────────────────────────

ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Lesson"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── Quiz ─────────────────────────────────────────────────────────────────────

ALTER TABLE "Quiz" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Quiz"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── QuizQuestion ─────────────────────────────────────────────────────────────

ALTER TABLE "QuizQuestion" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "QuizQuestion"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── QuizAttempt ──────────────────────────────────────────────────────────────

ALTER TABLE "QuizAttempt" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "QuizAttempt"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── Homework ─────────────────────────────────────────────────────────────────

ALTER TABLE "Homework" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Homework"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── HomeworkQuestion ─────────────────────────────────────────────────────────

ALTER TABLE "HomeworkQuestion" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "HomeworkQuestion"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── HomeworkSubmission ───────────────────────────────────────────────────────

ALTER TABLE "HomeworkSubmission" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "HomeworkSubmission"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── Enrollment ───────────────────────────────────────────────────────────────

ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Enrollment"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── LessonProgress ───────────────────────────────────────────────────────────

ALTER TABLE "LessonProgress" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "LessonProgress"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── QAQuestion ───────────────────────────────────────────────────────────────

ALTER TABLE "QAQuestion" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "QAQuestion"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── Certificate ──────────────────────────────────────────────────────────────

ALTER TABLE "Certificate" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Certificate"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── Coupon ───────────────────────────────────────────────────────────────────

ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Coupon"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── ApiKey ───────────────────────────────────────────────────────────────────

ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "ApiKey"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── Job ──────────────────────────────────────────────────────────────────────

ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Job"
  USING ("schoolId" = current_setting('app.school_id'));

-- ─── SchoolMembership ─────────────────────────────────────────────────────────

ALTER TABLE "SchoolMembership" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "SchoolMembership"
  USING ("schoolId" = current_setting('app.school_id'));
