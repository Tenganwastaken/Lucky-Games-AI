-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "countryCode" TEXT,
    "ageRange" TEXT,
    "gender" TEXT,
    "primaryGameType" TEXT NOT NULL,
    "gameTypesCount" INTEGER,
    "daysPerMonth" INTEGER NOT NULL,
    "avgSessionMinutes" INTEGER NOT NULL,
    "nightPlayPercent" INTEGER NOT NULL,
    "avgWagerEuro" REAL NOT NULL,
    "weeklyTotalEuro" REAL,
    "wagerVariability" TEXT,
    "depositsPerSession" INTEGER,
    "chasingFrequency" TEXT,
    "cancelWithdrawalCount" TEXT,
    "limitsSet" TEXT,
    "failedStopAttempts" TEXT,
    "relationshipConflict" TEXT,
    "riskAwareness" TEXT,
    "advice" TEXT NOT NULL DEFAULT '',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "winChanceEstimate" INTEGER NOT NULL DEFAULT 0,
    "lossChanceEstimate" INTEGER NOT NULL DEFAULT 0,
    "expectedWeeklySpend" REAL NOT NULL DEFAULT 0,
    "riskFactorsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RiskAssessment_countryCode_idx" ON "RiskAssessment"("countryCode");

-- CreateIndex
CREATE INDEX "RiskAssessment_userId_createdAt_idx" ON "RiskAssessment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RiskAssessment_primaryGameType_idx" ON "RiskAssessment"("primaryGameType");
