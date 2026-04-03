-- AlterTable (remove activeSpecials column, replaced by Special relation)
ALTER TABLE "Bar" DROP COLUMN IF EXISTS "activeSpecials";

-- CreateTable
CREATE TABLE "Special" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Special_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Special" ADD CONSTRAINT "Special_barId_fkey"
    FOREIGN KEY ("barId") REFERENCES "Bar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
