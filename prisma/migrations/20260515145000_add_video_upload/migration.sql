-- CreateEnum
CREATE TYPE "VideoUploadStatus" AS ENUM ('pending', 'processing', 'ready', 'error');

-- CreateTable
CREATE TABLE "VideoUpload" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" "VideoUploadStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoUpload_schoolId_idx" ON "VideoUpload"("schoolId");

-- AddForeignKey
ALTER TABLE "VideoUpload" ADD CONSTRAINT "VideoUpload_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS (consistent with other tenant-scoped tables)
ALTER TABLE "VideoUpload" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "VideoUpload"
  USING ("schoolId" = current_setting('app.school_id'));
