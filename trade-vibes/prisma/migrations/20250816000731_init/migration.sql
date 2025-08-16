-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Portfolio_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "averageCost" DECIMAL NOT NULL,
    "underlyingSymbol" TEXT,
    "expirationDate" DATETIME,
    "strike" DECIMAL,
    "optionType" TEXT,
    "openedAt" DATETIME,
    "closedAt" DATETIME,
    CONSTRAINT "Position_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "symbol" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "price" DECIMAL NOT NULL,
    "fees" DECIMAL NOT NULL DEFAULT 0,
    "underlyingSymbol" TEXT,
    "expirationDate" DATETIME,
    "strike" DECIMAL,
    "optionType" TEXT,
    "multiplier" DECIMAL NOT NULL DEFAULT 100,
    "orderId" TEXT,
    "notes" TEXT,
    CONSTRAINT "Transaction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "asOf" DATETIME NOT NULL,
    "cash" DECIMAL NOT NULL,
    "marketValue" DECIMAL NOT NULL,
    "totalEquity" DECIMAL NOT NULL,
    CONSTRAINT "Snapshot_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApiCredential_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Portfolio_accountId_idx" ON "Portfolio"("accountId");

-- CreateIndex
CREATE INDEX "Position_portfolioId_idx" ON "Position"("portfolioId");

-- CreateIndex
CREATE INDEX "Position_symbol_idx" ON "Position"("symbol");

-- CreateIndex
CREATE INDEX "Transaction_portfolioId_idx" ON "Transaction"("portfolioId");

-- CreateIndex
CREATE INDEX "Transaction_symbol_idx" ON "Transaction"("symbol");

-- CreateIndex
CREATE INDEX "Transaction_occurredAt_idx" ON "Transaction"("occurredAt");

-- CreateIndex
CREATE INDEX "Snapshot_portfolioId_idx" ON "Snapshot"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "Snapshot_portfolioId_asOf_key" ON "Snapshot"("portfolioId", "asOf");

-- CreateIndex
CREATE UNIQUE INDEX "ApiCredential_accountId_key" ON "ApiCredential"("accountId");
