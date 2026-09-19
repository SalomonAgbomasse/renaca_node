-- Script de migration pour convertir les données de l'ancienne base (gg1214_padme_finale)
-- vers le format de la nouvelle base (fnda_node)
-- Date: 2025-01-XX

-- ============================================
-- 1. CONVERSION DE LA TABLE customers
-- ============================================

-- Fonction pour convertir les dates DD/MM/YYYY en DATE
-- Note: Cette fonction doit être créée si elle n'existe pas
DELIMITER $$

CREATE FUNCTION IF NOT EXISTS CONVERT_DATE_FR(date_str VARCHAR(30))
RETURNS DATE
DETERMINISTIC
BEGIN
    DECLARE result DATE;
    IF date_str IS NULL OR date_str = '' THEN
        RETURN NULL;
    END IF;
    
    -- Format DD/MM/YYYY
    IF LENGTH(date_str) = 10 AND date_str LIKE '%/%/%' THEN
        SET result = STR_TO_DATE(date_str, '%d/%m/%Y');
    -- Format YYYY-MM-DD
    ELSEIF date_str LIKE '%-%-%' THEN
        SET result = STR_TO_DATE(date_str, '%Y-%m-%d');
    ELSE
        RETURN NULL;
    END IF;
    
    RETURN result;
END$$

DELIMITER ;

-- Conversion des customers
-- Note: Exécuter cette requête après avoir importé les données dans une table temporaire
-- ou directement sur l'ancienne base avant migration

-- Exemple de conversion INSERT INTO customers (nouvelle structure)
-- INSERT INTO customers (
--     id, idTypeCustomer, idUser, lastname, firstname, email, address, phone,
--     place_of_birth, birthdate, occupation, gender, isActive, created_at, updated_at, version
-- )
-- SELECT 
--     id,
--     idTypeCustomer,
--     idUser,
--     lastname,
--     firstname,
--     email,
--     address,
--     phone,
--     place_of_birth,
--     CONVERT_DATE_FR(birthdate) as birthdate,  -- Conversion DD/MM/YYYY -> DATE
--     occupation,
--     gender,
--     1 as isActive,  -- Par défaut actif
--     CASE 
--         WHEN created_at IS NOT NULL AND created_at != '' THEN 
--             STR_TO_DATE(created_at, '%d/%m/%Y à %H:%i:%s')
--         ELSE dateSaisie
--     END as created_at,
--     CASE 
--         WHEN updated_at IS NOT NULL AND updated_at != '' THEN 
--             STR_TO_DATE(updated_at, '%d/%m/%Y à %H:%i:%s')
--         ELSE NULL
--     END as updated_at,
--     COALESCE(version, 0) as version
-- FROM gg1214_padme_finale.customers;

-- ============================================
-- 2. CONVERSION DE LA TABLE contracts
-- ============================================

-- Fonction pour convertir idCreditType (VARCHAR) en idNatureCredit (INT)
-- Mapping: 'A' -> 1 (AMORT), 'HC' -> 2 (Hors Convention), etc.
DELIMITER $$

CREATE FUNCTION IF NOT EXISTS CONVERT_CREDIT_TYPE_TO_NATURE(idCreditType VARCHAR(255))
RETURNS INT
DETERMINISTIC
BEGIN
    CASE idCreditType
        WHEN 'A' THEN RETURN 1;  -- AMORT
        WHEN 'HC' THEN RETURN 2; -- Hors Convention
        ELSE RETURN 1;  -- Par défaut AMORT
    END CASE;
END$$

-- Fonction pour convertir taux VARCHAR en DECIMAL
CREATE FUNCTION IF NOT EXISTS CONVERT_TAUX(taux_str VARCHAR(255))
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE result DECIMAL(5,2);
    DECLARE clean_taux VARCHAR(255);
    
    IF taux_str IS NULL OR taux_str = '' THEN
        RETURN 0.00;
    END IF;
    
    -- Nettoyer le taux (enlever les %, espaces, etc.)
    SET clean_taux = REPLACE(REPLACE(REPLACE(taux_str, '%', ''), ' ', ''), ',', '.');
    
    -- Si c'est '1' ou similaire, retourner 1.00
    IF clean_taux = '1' OR clean_taux = '1.0' THEN
        RETURN 1.00;
    END IF;
    
    -- Convertir en DECIMAL
    SET result = CAST(clean_taux AS DECIMAL(5,2));
    
    -- Limiter à 100.00 max
    IF result > 100.00 THEN
        RETURN 100.00;
    END IF;
    
    RETURN result;
END$$

DELIMITER ;

-- Conversion des contracts
-- Note: idContractState doit être défini (par défaut 1 pour "Actif" par exemple)
-- INSERT INTO contracts (
--     id, idCustomer, idUser, idProduct, idAgency, idNatureCredit, idPeriodicite,
--     capital, duration, differe, taux, dateEff, dateEch1, dateEch,
--     pd, pc, surp, acc, fm, puttc, police, reference, garantieCompl,
--     etablissement, keyCont, isActive, contractType, created_at, updated_at
-- )
-- SELECT 
--     c.id,
--     c.idCustomer,
--     c.idUser,
--     c.idProduct,
--     c.idAgency,
--     CONVERT_CREDIT_TYPE_TO_NATURE(c.idCreditType) as idNatureCredit,  -- Conversion
--     c.idPeriodicite,
--     CAST(REPLACE(c.capital, ' ', '') AS UNSIGNED) as capital,  -- Conversion VARCHAR -> BIGINT
--     c.duration,
--     COALESCE(c.differe, 0) as differe,
--     CONVERT_TAUX(c.taux) as taux,  -- Conversion VARCHAR -> DECIMAL
--     CONVERT_DATE_FR(c.dateEff) as dateEff,  -- Conversion DD/MM/YYYY -> DATETIME
--     CONVERT_DATE_FR(c.dateEch1) as dateEch1,
--     CONVERT_DATE_FR(c.dateEch) as dateEch,
--     COALESCE(c.pd, 0) as pd,
--     COALESCE(c.pc, 0) as pc,
--     COALESCE(c.surp, 0) as surp,
--     COALESCE(c.acc, 0) as acc,
--     COALESCE(c.fm, 0) as fm,
--     COALESCE(c.puttc, 0) as puttc,
--     c.police,
--     c.reference,
--     COALESCE(c.garantieCompl, 'NON') as garantieCompl,
--     c.etablissement,
--     COALESCE(c.keyCont, CONCAT('KEY_', c.id)) as keyCont,  -- Générer si manquant
--     1 as isActive,  -- Par défaut actif
--     'STANDARD' as contractType,  -- Type par défaut
--     COALESCE(c.dateSaisie, NOW()) as created_at,
--     CASE 
--         WHEN c.updated_at IS NOT NULL AND c.updated_at != '' THEN 
--             STR_TO_DATE(c.updated_at, '%d/%m/%Y à %H:%i:%s')
--         ELSE NULL
--     END as updated_at
-- FROM gg1214_padme_finale.contracts c;

-- ============================================
-- 3. CONVERSION DE LA TABLE agency
-- ============================================

-- INSERT INTO agency (
--     id, idSubscriber, name, address, email, phone, fax, createdAt, updatedAt
-- )
-- SELECT 
--     id,
--     idSubscriber,
--     name,
--     address,
--     email,
--     phone,
--     fax,
--     CASE 
--         WHEN created_at IS NOT NULL AND created_at != '' THEN 
--             STR_TO_DATE(created_at, '%d/%m/%Y')
--         ELSE NOW()
--     END as createdAt,
--     CASE 
--         WHEN updated_at IS NOT NULL AND updated_at != '' THEN 
--             STR_TO_DATE(updated_at, '%d/%m/%Y')
--         ELSE NULL
--     END as updatedAt
-- FROM gg1214_padme_finale.agency;

-- ============================================
-- 4. NOTES IMPORTANTES
-- ============================================

-- 1. Vérifier que la table periodicite existe et contient les bonnes données
-- 2. Vérifier que la table nature_credits existe avec les IDs correspondants:
--    - id=1 pour 'AMORT' (code='A')
--    - id=2 pour 'HC' (code='HC')
-- 3. Vérifier que la table contract_state existe avec au moins un état (id=1)
-- 4. Vérifier que la table products existe avec les bons IDs
-- 5. Vérifier que la table type_customer existe avec les bons IDs
-- 6. Les clés étrangères doivent être vérifiées avant l'insertion
-- 7. Les dates invalides seront converties en NULL
-- 8. Les valeurs NULL seront gérées avec COALESCE et valeurs par défaut

-- ============================================
-- 5. SCRIPT DE VÉRIFICATION POST-MIGRATION
-- ============================================

-- Vérifier le nombre d'enregistrements
-- SELECT 'customers' as table_name, COUNT(*) as count FROM customers
-- UNION ALL
-- SELECT 'contracts', COUNT(*) FROM contracts
-- UNION ALL
-- SELECT 'agency', COUNT(*) FROM agency;

-- Vérifier les dates invalides
-- SELECT id, birthdate FROM customers WHERE birthdate IS NULL;
-- SELECT id, dateEff, dateEch1, dateEch FROM contracts WHERE dateEff IS NULL OR dateEch1 IS NULL OR dateEch IS NULL;

-- Vérifier les taux invalides
-- SELECT id, taux FROM contracts WHERE taux IS NULL OR taux < 0 OR taux > 100;

-- Vérifier les capitales invalides
-- SELECT id, capital FROM contracts WHERE capital IS NULL OR capital <= 0;

