-- Day 2 hardening migration
-- 1) Enforce role domain (USER|ADMIN) at DB level
-- 2) Add indexes for hot query paths

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER' CHECK ("role" IN ('USER', 'ADMIN')),
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_User" ("id", "name", "email", "password", "role", "totalPoints", "createdAt")
SELECT
    "id",
    "name",
    "email",
    "password",
    CASE
      WHEN "role" IN ('USER', 'ADMIN') THEN "role"
      ELSE 'USER'
    END,
    "totalPoints",
    "createdAt"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_totalPoints_idx" ON "User"("totalPoints");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

CREATE INDEX "Match_datetime_idx" ON "Match"("datetime");
CREATE INDEX "Goal_matchId_idx" ON "Goal"("matchId");
CREATE INDEX "Guess_userId_idx" ON "Guess"("userId");
CREATE INDEX "Guess_matchId_idx" ON "Guess"("matchId");
