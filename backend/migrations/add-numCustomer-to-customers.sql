-- Migration: Ajouter le champ numCustomer à la table customers
-- Date: 2025-12-27
-- Description: Ajoute le champ numCustomer (varchar(15), default '0') à la table customers

-- Vérifier si la colonne existe déjà avant de l'ajouter
SET @dbname = DATABASE();
SET @tablename = "customers";
SET @columnname = "numCustomer";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column numCustomer already exists in customers table.' AS result;",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(15) NOT NULL DEFAULT '0' AFTER idUser;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Mettre à jour les valeurs NULL existantes (si nécessaire)
UPDATE customers SET numCustomer = '0' WHERE numCustomer IS NULL;

