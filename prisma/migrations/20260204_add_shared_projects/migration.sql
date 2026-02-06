-- CreateTable
CREATE TABLE "shared_projects" (
    "id" TEXT NOT NULL,
    "project_id" INTEGER,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "shared_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shared_projects_project_id_idx" ON "shared_projects"("project_id");

-- AddForeignKey
ALTER TABLE "shared_projects" ADD CONSTRAINT "shared_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
