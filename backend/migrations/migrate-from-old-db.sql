-- ============================================
-- SCRIPT DE MIGRATION COMPLET
-- Conversion de gg1214_padme_finale vers fnda_node
-- ============================================

-- IMPORTANT: Exécuter ce script sur la base de données cible (fnda_node)
-- après avoir importé les données de l'ancienne base dans des tables temporaires
-- ou directement depuis l'ancienne base si elle est accessible

USE fnda_node;

-- ============================================
-- ÉTAPE 1: Préparer les fonctions de conversion
-- ============================================

DELIMITER $$

-- Fonction pour convertir les dates DD/MM/YYYY en DATE
DROP FUNCTION IF EXISTS CONVERT_DATE_FR$$
CREATE FUNCTION CONVERT_DATE_FR(date_str VARCHAR(30))
RETURNS DATE
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE result DATE;
    IF date_str IS NULL OR date_str = '' OR date_str = 'NULL' THEN
        RETURN NULL;
    END IF;
    
    -- Format DD/MM/YYYY
    IF LENGTH(date_str) = 10 AND date_str LIKE '%/%/%' THEN
        SET result = STR_TO_DATE(date_str, '%d/%m/%Y');
        IF result IS NULL THEN
            RETURN NULL;
        END IF;
    -- Format YYYY-MM-DD
    ELSEIF date_str LIKE '%-%-%' AND LENGTH(date_str) >= 10 THEN
        SET result = CAST(date_str AS DATE);
    ELSE
        RETURN NULL;
    END IF;
    
    RETURN result;
END$$

-- Fonction pour convertir idCreditType en idNatureCredit
DROP FUNCTION IF EXISTS CONVERT_CREDIT_TYPE_TO_NATURE$$
CREATE FUNCTION CONVERT_CREDIT_TYPE_TO_NATURE(idCreditType VARCHAR(255))
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    IF idCreditType IS NULL OR idCreditType = '' THEN
        RETURN 1;  -- Par défaut AMORT
    END IF;
    
    CASE UPPER(TRIM(idCreditType))
        WHEN 'A' THEN RETURN 1;  -- AMORT
        WHEN 'HC' THEN RETURN 2; -- Hors Convention
        WHEN 'AMORT' THEN RETURN 1;
        WHEN 'HORS_CONVENTION' THEN RETURN 2;
        ELSE RETURN 1;  -- Par défaut AMORT
    END CASE;
END$$

-- Fonction pour convertir taux VARCHAR en DECIMAL
DROP FUNCTION IF EXISTS CONVERT_TAUX$$
CREATE FUNCTION CONVERT_TAUX(taux_str VARCHAR(255))
RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE result DECIMAL(5,2);
    DECLARE clean_taux VARCHAR(255);
    
    IF taux_str IS NULL OR taux_str = '' OR taux_str = 'NULL' THEN
        RETURN 0.00;
    END IF;
    
    -- Nettoyer le taux (enlever les %, espaces, etc.)
    SET clean_taux = REPLACE(REPLACE(REPLACE(REPLACE(taux_str, '%', ''), ' ', ''), ',', '.'), 'NULL', '');
    
    IF clean_taux = '' OR clean_taux = 'NULL' THEN
        RETURN 0.00;
    END IF;
    
    -- Si c'est '1' ou similaire, retourner 1.00
    IF clean_taux = '1' OR clean_taux = '1.0' OR clean_taux = '1.00' THEN
        RETURN 1.00;
    END IF;
    
    -- Convertir en DECIMAL
    SET result = CAST(clean_taux AS DECIMAL(5,2));
    
    -- Vérifier si la conversion a réussi
    IF result IS NULL THEN
        RETURN 0.00;
    END IF;
    
    -- Limiter à 100.00 max
    IF result > 100.00 THEN
        RETURN 100.00;
    END IF;
    
    IF result < 0 THEN
        RETURN 0.00;
    END IF;
    
    RETURN result;
END$$

-- Fonction pour convertir datetime string en DATETIME
DROP FUNCTION IF EXISTS CONVERT_DATETIME_FR$$
CREATE FUNCTION CONVERT_DATETIME_FR(datetime_str VARCHAR(50))
RETURNS DATETIME
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE result DATETIME;
    IF datetime_str IS NULL OR datetime_str = '' OR datetime_str = 'NULL' THEN
        RETURN NULL;
    END IF;
    
    -- Format "DD/MM/YYYY à HH:MM:SS"
    IF datetime_str LIKE '%/%/% à %:%:%' THEN
        SET result = STR_TO_DATE(datetime_str, '%d/%m/%Y à %H:%i:%s');
    -- Format "DD/MM/YYYY"
    ELSEIF datetime_str LIKE '%/%/%' AND LENGTH(datetime_str) = 10 THEN
        SET result = STR_TO_DATE(datetime_str, '%d/%m/%Y');
    -- Format ISO
    ELSEIF datetime_str LIKE '%-%-% %:%:%' THEN
        SET result = CAST(datetime_str AS DATETIME);
    ELSE
        RETURN NULL;
    END IF;
    
    RETURN result;
END$$

DELIMITER ;

-- ============================================
-- ÉTAPE 2: Vérifier les tables de référence
-- ============================================

-- Vérifier que periodicite existe
SELECT COUNT(*) as periodicite_count FROM periodicite;

-- Vérifier que nature_credits existe (doit avoir id=1 pour AMORT, id=2 pour HC)
SELECT id, code, libelle FROM nature_credits ORDER BY id;

-- Vérifier que contract_state existe (au moins un état avec id=1)
SELECT id, libelle FROM contract_state ORDER BY id LIMIT 1;

-- Vérifier que products existe
SELECT id, code, title FROM products ORDER BY id LIMIT 5;

-- Vérifier que type_customer existe
SELECT id, libelle FROM type_customer ORDER BY id;

-- ============================================
-- ÉTAPE 3: Migration des customers
-- ============================================

-- IMPORTANT: Remplacer 'gg1214_padme_finale' par le nom de votre ancienne base
-- ou utiliser des tables temporaires

INSERT INTO customers (
    id, idTypeCustomer, idUser, updatedBy, deletedBy, lastname, firstname, email, address, phone,
    place_of_birth, birthdate, occupation, gender, isActive, created_at, updated_at, deleted_at, version
)
SELECT 
    old.id,
    old.idTypeCustomer,
    old.idUser,
    NULL as updatedBy,  -- Pas de champ updatedBy dans l'ancienne base
    NULL as deletedBy,  -- Pas de champ deletedBy dans l'ancienne base
    old.lastname,
    old.firstname,
    NULLIF(old.email, '') as email,
    old.address,
    old.phone,
    old.place_of_birth,
    CONVERT_DATE_FR(old.birthdate) as birthdate,
    old.occupation,
    old.gender,
    1 as isActive,
    COALESCE(
        CONVERT_DATETIME_FR(old.created_at),
        old.dateSaisie,
        NOW()
    ) as created_at,
    CONVERT_DATETIME_FR(old.updated_at) as updated_at,
    NULL as deleted_at,
    COALESCE(old.version, 0) as version
FROM gg1214_padme_finale.customers old
WHERE NOT EXISTS (
    SELECT 1 FROM customers new WHERE new.id = old.id
)
ON DUPLICATE KEY UPDATE
    lastname = VALUES(lastname),
    firstname = VALUES(firstname),
    email = VALUES(email),
    address = VALUES(address),
    phone = VALUES(phone),
    place_of_birth = VALUES(place_of_birth),
    birthdate = VALUES(birthdate),
    occupation = VALUES(occupation),
    gender = VALUES(gender),
    updated_at = NOW();

-- ============================================
-- ÉTAPE 4: Migration des contracts
-- ============================================

-- IMPORTANT: 
-- - idContractState: utiliser 1 par défaut (ou l'ID de l'état "Actif")
-- - idProduct: vérifier que les IDs correspondent
-- - keyCont: générer si manquant

INSERT INTO contracts (
    id, idCustomer, idUser, updatedBy, deletedBy, idProduct, idContractState, idAgency, idNatureCredit, idPeriodicite,
    capital, duration, differe, taux, dateEff, dateEch1, dateEch,
    pd, pc, surp, acc, fm, puttc, police, reference, garantieCompl,
    etablissement, keyCont, isActive, contractType, created_at, updated_at, deleted_at
)
SELECT 
    old.id,
    old.idCustomer,
    old.idUser,
    NULL as updatedBy,  -- Pas de champ updatedBy dans l'ancienne base
    NULL as deletedBy,  -- Pas de champ deletedBy dans l'ancienne base
    old.idProduct,
    1 as idContractState,  -- À ajuster selon votre table contract_state
    old.idAgency,
    CONVERT_CREDIT_TYPE_TO_NATURE(old.idCreditType) as idNatureCredit,
    old.idPeriodicite,
    CAST(REPLACE(REPLACE(old.capital, ' ', ''), ',', '') AS UNSIGNED) as capital,
    old.duration,
    COALESCE(old.differe, 0) as differe,
    CONVERT_TAUX(old.taux) as taux,
    CAST(CONVERT_DATE_FR(old.dateEff) AS DATETIME) as dateEff,
    CAST(CONVERT_DATE_FR(old.dateEch1) AS DATETIME) as dateEch1,
    CAST(CONVERT_DATE_FR(old.dateEch) AS DATETIME) as dateEch,
    COALESCE(old.pd, 0) as pd,
    COALESCE(old.pc, 0) as pc,
    COALESCE(old.surp, 0) as surp,
    COALESCE(old.acc, 0) as acc,
    COALESCE(old.fm, 0) as fm,
    COALESCE(old.puttc, 0) as puttc,
    old.police,
    old.reference,
    COALESCE(old.garantieCompl, 'NON') as garantieCompl,
    old.etablissement,
    COALESCE(
        old.keyCont,
        CONCAT('KEY_', old.id, '_', UNIX_TIMESTAMP())
    ) as keyCont,
    1 as isActive,
    'STANDARD' as contractType,
    COALESCE(old.dateSaisie, NOW()) as created_at,
    CONVERT_DATETIME_FR(old.updated_at) as updated_at,
    NULL as deleted_at
FROM gg1214_padme_finale.contracts old
WHERE NOT EXISTS (
    SELECT 1 FROM contracts new WHERE new.id = old.id
)
ON DUPLICATE KEY UPDATE
    idCustomer = VALUES(idCustomer),
    capital = VALUES(capital),
    duration = VALUES(duration),
    differe = VALUES(differe),
    taux = VALUES(taux),
    dateEff = VALUES(dateEff),
    dateEch1 = VALUES(dateEch1),
    dateEch = VALUES(dateEch),
    updated_at = NOW();

-- ============================================
-- ÉTAPE 5: Migration des agencies
-- ============================================

INSERT INTO agency (
    id, idSubscriber, createdBy, updatedBy, deletedBy, name, address, email, phone, fax, createdAt, updatedAt, deletedAt
)
SELECT 
    old.id,
    old.idSubscriber,
    1 as createdBy,  -- Par défaut user ID 1
    NULL as updatedBy,  -- Pas de champ updatedBy dans l'ancienne base
    NULL as deletedBy,  -- Pas de champ deletedBy dans l'ancienne base
    old.name,
    old.address,
    NULLIF(old.email, '') as email,
    old.phone,
    old.fax,
    COALESCE(
        CONVERT_DATETIME_FR(old.created_at),
        NOW()
    ) as createdAt,
    CONVERT_DATETIME_FR(old.updated_at) as updatedAt,
    NULL as deletedAt
FROM gg1214_padme_finale.agency old
WHERE NOT EXISTS (
    SELECT 1 FROM agency new WHERE new.id = old.id
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    address = VALUES(address),
    email = VALUES(email),
    phone = VALUES(phone),
    fax = VALUES(fax),
    updatedAt = NOW();

-- ============================================
-- ÉTAPE 6: Nettoyage des fonctions temporaires
-- ============================================

DROP FUNCTION IF EXISTS CONVERT_DATE_FR;
DROP FUNCTION IF EXISTS CONVERT_CREDIT_TYPE_TO_NATURE;
DROP FUNCTION IF EXISTS CONVERT_TAUX;
DROP FUNCTION IF EXISTS CONVERT_DATETIME_FR;

-- ============================================
-- ÉTAPE 7: Vérifications post-migration
-- ============================================

-- Compter les enregistrements migrés
SELECT 'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'agency', COUNT(*) FROM agency;

-- Vérifier les dates invalides dans customers
SELECT id, lastname, firstname, birthdate 
FROM customers 
WHERE birthdate IS NULL 
LIMIT 10;

-- Vérifier les dates invalides dans contracts
SELECT id, reference, dateEff, dateEch1, dateEch 
FROM contracts 
WHERE dateEff IS NULL OR dateEch1 IS NULL OR dateEch IS NULL
LIMIT 10;

-- Vérifier les taux invalides
SELECT id, reference, taux 
FROM contracts 
WHERE taux IS NULL OR taux < 0 OR taux > 100
LIMIT 10;

-- Vérifier les capitales invalides
SELECT id, reference, capital 
FROM contracts 
WHERE capital IS NULL OR capital <= 0
LIMIT 10;

-- Vérifier les idNatureCredit
SELECT idNatureCredit, COUNT(*) as count 
FROM contracts 
GROUP BY idNatureCredit;

-- ============================================
-- FIN DU SCRIPT
-- ============================================

