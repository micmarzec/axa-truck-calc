-- CreateTable
CREATE TABLE "Certificate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numerCertyfikatu" TEXT NOT NULL,
    "numerUmowy" TEXT NOT NULL,
    "daneKlienta" TEXT NOT NULL,
    "dataWystawienia" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_numerCertyfikatu_key" ON "Certificate"("numerCertyfikatu");
