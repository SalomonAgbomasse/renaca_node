-- Migration pour ajouter le support PADME_FNDA
-- Date: 2024-11-25

-- 1. Créer la table periodicite
CREATE TABLE IF NOT EXISTS `periodicite` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `libelle` VARCHAR(50) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `nombreMois` INT NOT NULL,
  `description` TEXT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Insérer les données de periodicite
INSERT INTO `periodicite` (`id`, `libelle`, `code`, `nombreMois`, `description`, `isActive`) VALUES
(1, 'Mensuelle', 'M', 1, 'Paiement tous les mois', 1),
(2, 'Bimestrielle', 'B', 2, 'Paiement tous les deux mois', 1),
(3, 'Trimestrielle', 'T', 3, 'Paiement tous les trois mois', 1),
(4, 'Quadrimesuelle', 'Q', 4, 'Paiement tous les quatre mois', 1),
(5, 'Quinquamestrielle', 'QQ', 5, 'Paiement tous les cinq mois', 1),
(6, 'Semestrielle', 'S', 6, 'Paiement tous les six mois', 1),
(12, 'Annuelle/Constant', 'A', 12, 'Paiement annuel ou constant', 1);

-- 3. Ajouter les colonnes à la table cotation si elles n'existent pas
ALTER TABLE `cotation` 
ADD COLUMN IF NOT EXISTS `idPeriodicite` INT NULL AFTER `idNatureCredit`,
ADD COLUMN IF NOT EXISTS `differe` INT NOT NULL DEFAULT 0 AFTER `duration`;

-- 4. Ajouter l'index et la clé étrangère pour la table cotation
ALTER TABLE `cotation`
ADD INDEX `FK_cotation_periodicite` (`idPeriodicite`),
ADD CONSTRAINT `FK_cotation_periodicite` 
  FOREIGN KEY (`idPeriodicite`) 
  REFERENCES `periodicite` (`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- 5. Ajouter les colonnes à la table contracts si elles n'existent pas
ALTER TABLE `contracts` 
ADD COLUMN IF NOT EXISTS `differe` INT NOT NULL DEFAULT 0 AFTER `duration`,
ADD COLUMN IF NOT EXISTS `idPeriodicite` INT NULL AFTER `differe`;

-- 6. Ajouter l'index et la clé étrangère pour la table contracts
ALTER TABLE `contracts`
ADD INDEX `FK_contracts_periodicite` (`idPeriodicite`),
ADD CONSTRAINT `FK_contracts_periodicite` 
  FOREIGN KEY (`idPeriodicite`) 
  REFERENCES `periodicite` (`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- 7. Mettre à jour les valeurs par défaut pour les enregistrements existants
UPDATE `cotation` SET `differe` = 0 WHERE `differe` IS NULL;
UPDATE `contracts` SET `differe` = 0 WHERE `differe` IS NULL;

-- Fin de la migration
