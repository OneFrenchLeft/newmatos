-- Suppression de l'ancienne colonne missingItems si elle existe
ALTER TABLE `Tent` DROP COLUMN IF EXISTS `missingItems`;

-- Ajout des booléens dédiés
ALTER TABLE `Tent`
  ADD COLUMN IF NOT EXISTS `missingZip`        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `missingFaitiere`   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `missingDoubleToit` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `missingToile`      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `missingTapis`      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `missingSardines`   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `missingSacTente`   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `inspectionHistory` TEXT NULL;
