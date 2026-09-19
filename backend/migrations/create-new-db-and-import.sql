-- ============================================
-- SCRIPT DE CRÉATION DE NOUVELLE BASE ET IMPORT
-- Crée une nouvelle base et importe le fichier SQL de l'ancienne base
-- ============================================

-- IMPORTANT: 
-- 1. Exécuter ce script en premier pour créer la nouvelle base
-- 2. Ensuite, exécuter le fichier SQL de l'ancienne base dans cette nouvelle base
-- 3. Enfin, exécuter migrate-from-old-db.sql pour convertir les données

-- ============================================
-- ÉTAPE 1: Créer la nouvelle base de données
-- ============================================

-- Modifier le nom de la base si nécessaire
SET @new_db_name = 'fnda_node_import';

-- Supprimer la base si elle existe déjà (ATTENTION: supprime toutes les données!)
DROP DATABASE IF EXISTS `fnda_node_import`;

-- Créer la nouvelle base
CREATE DATABASE `fnda_node_import` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Utiliser la nouvelle base
USE `fnda_node_import`;

-- ============================================
-- ÉTAPE 2: Instructions pour l'import
-- ============================================

-- Après avoir exécuté ce script, vous devez :
-- 1. Importer le fichier SQL de l'ancienne base dans cette nouvelle base
--    Commande MySQL:
--    mysql -u root -p fnda_node_import < "backend/Sql/gg1214_padme_finale (2) (1).sql"
--
--    Ou via MySQL Workbench/phpMyAdmin:
--    - Sélectionner la base fnda_node_import
--    - Importer le fichier "gg1214_padme_finale (2) (1).sql"
--
-- 2. Vérifier que les données sont bien importées:
SELECT 'Base de données créée avec succès!' as message;
SELECT DATABASE() as current_database;

-- ============================================
-- ÉTAPE 3: Vérifications post-import
-- ============================================

-- Après l'import, exécuter ces requêtes pour vérifier:

-- Vérifier les tables principales
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'fnda_node_import'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
LIMIT 10;

-- Compter les enregistrements dans les tables principales
SELECT 'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'agency', COUNT(*) FROM agency;

-- ============================================
-- ÉTAPE 4: Conversion vers le format de l'application
-- ============================================

-- Après avoir importé les données, vous pouvez:
-- 1. Exécuter le script migrate-from-old-db.sql
--    (en modifiant le nom de la base source dans le script)
-- 2. Ou créer un nouveau script de conversion spécifique

-- ============================================
-- FIN DU SCRIPT
-- ============================================





