-- CreateTable
CREATE TABLE "EssentialOilWishlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "scentCategory" TEXT,
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "purchaseUrl" TEXT,
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Formulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not-tested',
    "melissaApproved" BOOLEAN NOT NULL DEFAULT false,
    "totalVolumeMl" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Formulation" ("createdAt", "id", "name", "notes", "purpose", "totalVolumeMl", "updatedAt") SELECT "createdAt", "id", "name", "notes", "purpose", "totalVolumeMl", "updatedAt" FROM "Formulation";
DROP TABLE "Formulation";
ALTER TABLE "new_Formulation" RENAME TO "Formulation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EssentialOilWishlist_name_key" ON "EssentialOilWishlist"("name");
