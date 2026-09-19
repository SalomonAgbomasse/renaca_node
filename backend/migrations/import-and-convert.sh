#!/bin/bash

# ============================================
# SCRIPT BASH POUR IMPORT ET CONVERSION
# Automatise l'import et la conversion des données
# ============================================

# Configuration
NEW_DB_NAME="fnda_node_import"
OLD_SQL_FILE="backend/Sql/gg1214_padme_finale (2) (1).sql"
MYSQL_USER="root"
MYSQL_PASSWORD=""
MIGRATION_SCRIPT="backend/migrations/migrate-from-old-db.sql"

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SCRIPT D'IMPORT ET CONVERSION${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Étape 1: Créer la nouvelle base
echo -e "${YELLOW}Étape 1: Création de la nouvelle base de données...${NC}"
mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" < backend/migrations/create-new-db-and-import.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Base de données créée avec succès!${NC}"
else
    echo -e "${RED}✗ Erreur lors de la création de la base${NC}"
    exit 1
fi

echo ""

# Étape 2: Importer le fichier SQL de l'ancienne base
echo -e "${YELLOW}Étape 2: Import du fichier SQL de l'ancienne base...${NC}"
if [ -f "$OLD_SQL_FILE" ]; then
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$NEW_DB_NAME" < "$OLD_SQL_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Fichier SQL importé avec succès!${NC}"
    else
        echo -e "${RED}✗ Erreur lors de l'import du fichier SQL${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Fichier SQL introuvable: $OLD_SQL_FILE${NC}"
    exit 1
fi

echo ""

# Étape 3: Vérifications
echo -e "${YELLOW}Étape 3: Vérification des données importées...${NC}"
mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$NEW_DB_NAME" -e "
SELECT 'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'agency', COUNT(*) FROM agency;
"

echo ""

# Étape 4: Conversion (optionnel)
read -p "Voulez-vous convertir les données vers le format de l'application? (o/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${YELLOW}Étape 4: Conversion des données...${NC}"
    echo -e "${YELLOW}⚠️  ATTENTION: Modifiez d'abord le script migrate-from-old-db.sql${NC}"
    echo -e "${YELLOW}   pour utiliser '$NEW_DB_NAME' comme base source${NC}"
    read -p "Appuyez sur Entrée pour continuer..."
    
    # Modifier temporairement le script pour utiliser la nouvelle base
    sed -i.bak "s/gg1214_padme_finale/$NEW_DB_NAME/g" "$MIGRATION_SCRIPT"
    sed -i.bak "s/USE fnda_node;/USE fnda_node;/g" "$MIGRATION_SCRIPT"
    
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" < "$MIGRATION_SCRIPT"
    
    # Restaurer le script original
    mv "$MIGRATION_SCRIPT.bak" "$MIGRATION_SCRIPT"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Conversion terminée avec succès!${NC}"
    else
        echo -e "${RED}✗ Erreur lors de la conversion${NC}"
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}IMPORT TERMINÉ!${NC}"
echo -e "${GREEN}========================================${NC}"





