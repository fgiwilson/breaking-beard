/*
  Warnings:

  - You are about to drop the column `maxUsagePct` on the `EssentialOil` table. All the data in the column will be lost.
  - You are about to drop the column `minUsagePct` on the `EssentialOil` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EssentialOil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "scentCategory" TEXT,
    "safetyNotes" TEXT,
    "minDrops" INTEGER,
    "maxDrops" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EssentialOil" ("createdAt", "id", "name", "notes", "safetyNotes", "scentCategory", "updatedAt") SELECT "createdAt", "id", "name", "notes", "safetyNotes", "scentCategory", "updatedAt" FROM "EssentialOil";
DROP TABLE "EssentialOil";
ALTER TABLE "new_EssentialOil" RENAME TO "EssentialOil";
CREATE UNIQUE INDEX "EssentialOil_name_key" ON "EssentialOil"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
