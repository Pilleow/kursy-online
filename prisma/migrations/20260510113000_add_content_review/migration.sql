-- Migration: add_content_review
-- Date: 2026-05-29
--
-- Adds the ContentReview model used to track instructor change submissions
-- pending school_admin approval (spec sections 4.1 and 6).

CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "ContentReview" (
  "id"              TEXT NOT NULL,
  "lessonId"        TEXT NOT NULL,
  "courseId"        TEXT NOT NULL,
  "schoolId"        TEXT NOT NULL,
  "instructorId"    TEXT NOT NULL,
  "changeSnapshot"  JSONB NOT NULL,
  "status"          "ReviewStatus" NOT NULL DEFAULT 'pending',
  "reviewerComment" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt"      TIMESTAMP(3),

  CONSTRAINT "ContentReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentReview_courseId_idx"  ON "ContentReview"("courseId");
CREATE INDEX "ContentReview_schoolId_idx"  ON "ContentReview"("schoolId");
CREATE INDEX "ContentReview_lessonId_idx"  ON "ContentReview"("lessonId");
CREATE INDEX "ContentReview_status_idx"    ON "ContentReview"("status");

ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
