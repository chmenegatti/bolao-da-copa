-- CreateTable
CREATE TABLE "TopScorerBet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "totalGoals" INTEGER NOT NULL,
    "pointsEarned" INTEGER,
    CONSTRAINT "TopScorerBet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChampionBet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "champion" TEXT NOT NULL,
    "runnerUp" TEXT NOT NULL,
    "finalScoreA" INTEGER NOT NULL,
    "finalScoreB" INTEGER NOT NULL,
    "pointsEarned" INTEGER,
    CONSTRAINT "ChampionBet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TournamentResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "topScorerName" TEXT,
    "topScorerGoals" INTEGER,
    "champion" TEXT,
    "runnerUp" TEXT,
    "finalScoreA" INTEGER,
    "finalScoreB" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "TopScorerBet_userId_key" ON "TopScorerBet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionBet_userId_key" ON "ChampionBet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentResult_key_key" ON "TournamentResult"("key");
