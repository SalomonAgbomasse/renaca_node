-- ==============================================================================
-- RENACA - Patch SQL Idempotent pour MariaDB / MySQL Production
-- Date : 28 Septembre 2026
-- Description : Compatible MariaDB 10.2+ (utilise IF NOT EXISTS pour éviter toute erreur)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. TABLE : users (Sécurité, verrouillage, motifs et UUID)
-- ------------------------------------------------------------------------------

-- Compteur de tentatives de connexion échouées
ALTER TABLE `users` 
  ADD COLUMN IF NOT EXISTS `login_attempts` INT NOT NULL DEFAULT 0;

-- Date/heure jusqu'à laquelle le compte est verrouillé (NULL si actif)
ALTER TABLE `users` 
  ADD COLUMN IF NOT EXISTS `locked_until` DATETIME NULL DEFAULT NULL;

-- Motifs de suspension et de suppression
ALTER TABLE `users` 
  ADD COLUMN IF NOT EXISTS `suspension_reason` VARCHAR(500) NULL DEFAULT NULL;

ALTER TABLE `users` 
  ADD COLUMN IF NOT EXISTS `deletion_reason` VARCHAR(500) NULL DEFAULT NULL;

-- Identifiant UUID public pour les routes sécurisées
ALTER TABLE `users` 
  ADD COLUMN IF NOT EXISTS `uuid` VARCHAR(36) NULL DEFAULT NULL;

-- Dernière connexion et 2FA (si absents)
ALTER TABLE `users` 
  ADD COLUMN IF NOT EXISTS `last_login` DATETIME NULL DEFAULT NULL;

ALTER TABLE `users` 
  ADD COLUMN IF NOT EXISTS `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE `users` 
  ADD COLUMN IF NOT EXISTS `two_factor_secret` VARCHAR(255) NULL DEFAULT NULL;

-- Génération des UUID pour les utilisateurs existants
UPDATE `users` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';

-- Ajout de l'index UNIQUE sur le UUID
ALTER TABLE `users` ADD UNIQUE INDEX IF NOT EXISTS `idx_users_uuid` (`uuid`);


-- ------------------------------------------------------------------------------
-- 2. TABLE : contracts (Bénéficiaires, versioning et UUID)
-- ------------------------------------------------------------------------------

-- Récapitulatif texte des bénéficiaires
ALTER TABLE `contracts` 
  ADD COLUMN IF NOT EXISTS `benef` VARCHAR(250) NULL DEFAULT NULL;

-- Version du contrat (défaut '0')
ALTER TABLE `contracts` 
  ADD COLUMN IF NOT EXISTS `version` VARCHAR(30) NULL DEFAULT '0';

-- Identifiant UUID
ALTER TABLE `contracts` 
  ADD COLUMN IF NOT EXISTS `uuid` VARCHAR(36) NULL DEFAULT NULL;

-- Génération des UUID pour les contrats existants
UPDATE `contracts` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';

-- Index UNIQUE sur uuid
ALTER TABLE `contracts` ADD UNIQUE INDEX IF NOT EXISTS `idx_contracts_uuid` (`uuid`);


-- ------------------------------------------------------------------------------
-- 3. TABLES ASSOCIÉES : UUID pour customers, cotation, agency, office, tickets
-- ------------------------------------------------------------------------------

-- A. Table customers
ALTER TABLE `customers` ADD COLUMN IF NOT EXISTS `uuid` VARCHAR(36) NULL DEFAULT NULL;
UPDATE `customers` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
ALTER TABLE `customers` ADD UNIQUE INDEX IF NOT EXISTS `idx_customers_uuid` (`uuid`);

-- B. Table cotation (ou cotations)
ALTER TABLE `cotation` ADD COLUMN IF NOT EXISTS `uuid` VARCHAR(36) NULL DEFAULT NULL;
UPDATE `cotation` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
ALTER TABLE `cotation` ADD UNIQUE INDEX IF NOT EXISTS `idx_cotation_uuid` (`uuid`);

-- C. Table agency (ou agencies)
ALTER TABLE `agency` ADD COLUMN IF NOT EXISTS `uuid` VARCHAR(36) NULL DEFAULT NULL;
UPDATE `agency` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
ALTER TABLE `agency` ADD UNIQUE INDEX IF NOT EXISTS `idx_agency_uuid` (`uuid`);

-- D. Table office
ALTER TABLE `office` ADD COLUMN IF NOT EXISTS `uuid` VARCHAR(36) NULL DEFAULT NULL;
UPDATE `office` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
ALTER TABLE `office` ADD UNIQUE INDEX IF NOT EXISTS `idx_office_uuid` (`uuid`);

-- E. Table tickets
ALTER TABLE `tickets` ADD COLUMN IF NOT EXISTS `uuid` VARCHAR(36) NULL DEFAULT NULL;
UPDATE `tickets` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
ALTER TABLE `tickets` ADD UNIQUE INDEX IF NOT EXISTS `idx_tickets_uuid` (`uuid`);

-- F. Table roles
ALTER TABLE `roles` ADD COLUMN IF NOT EXISTS `code` VARCHAR(10) NULL DEFAULT NULL;


-- ------------------------------------------------------------------------------
-- 4. NOUVELLE TABLE : generated_documents (Visionneur PDF et traçabilité)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `generated_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `documentKey` VARCHAR(50) NOT NULL UNIQUE,
  `documentType` VARCHAR(50) NOT NULL DEFAULT 'CONTRAT',
  `entityId` INT NOT NULL,
  `entityReference` VARCHAR(100) NULL,
  `clientName` VARCHAR(150) NULL,
  `generatedById` INT NULL,
  `generatedByName` VARCHAR(150) NULL,
  `agencyName` VARCHAR(150) NULL,
  `metadata` JSON NULL,
  `downloadCount` INT NOT NULL DEFAULT 1,
  `lastDownloadedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_gen_doc_key` (`documentKey`),
  INDEX `idx_gen_doc_entity` (`entityId`, `documentType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------------------------
-- 5. NOUVELLE TABLE : beneficiaries (Bénéficiaires multiples par contrat)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `beneficiaries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `idContract` INT NOT NULL,
  `nomPrenoms` VARCHAR(255) NOT NULL,
  `lienParente` VARCHAR(100) NOT NULL,
  `pourcentage` DECIMAL(5,2) NOT NULL,
  INDEX `idx_beneficiaries_idContract` (`idContract`),
  CONSTRAINT `fk_beneficiaries_contract` 
    FOREIGN KEY (`idContract`) REFERENCES `contracts` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- Fin du script
-- ==============================================================================
