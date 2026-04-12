-- CreateTable
CREATE TABLE "BrandAmbassador" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Brand Ambassador',
    "instagramHandle" TEXT,
    "avatarInitials" TEXT NOT NULL,
    "avatarColor" TEXT NOT NULL DEFAULT '#FF5C00',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandAmbassador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarEvent" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'performance',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "performer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BrandAmbassador" ADD CONSTRAINT "BrandAmbassador_barId_fkey" FOREIGN KEY ("barId") REFERENCES "Bar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarEvent" ADD CONSTRAINT "BarEvent_barId_fkey" FOREIGN KEY ("barId") REFERENCES "Bar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
