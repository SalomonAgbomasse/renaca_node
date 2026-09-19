@echo off
REM ============================================
REM SCRIPT BATCH POUR IMPORT ET CONVERSION (Windows)
REM Automatise l'import et la conversion des données
REM ============================================

REM Configuration
set NEW_DB_NAME=fnda_node_import
set OLD_SQL_FILE=backend\Sql\gg1214_padme_finale (2) (1).sql
set MYSQL_USER=root
set MYSQL_PASSWORD=
set MIGRATION_SCRIPT=backend\migrations\migrate-from-old-db.sql

echo ========================================
echo SCRIPT D'IMPORT ET CONVERSION
echo ========================================
echo.

REM Étape 1: Créer la nouvelle base
echo Étape 1: Création de la nouvelle base de données...
mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD% ^< backend\migrations\create-new-db-and-import.sql

if %errorlevel% equ 0 (
    echo [OK] Base de données créée avec succès!
) else (
    echo [ERREUR] Erreur lors de la création de la base
    pause
    exit /b 1
)

echo.

REM Étape 2: Importer le fichier SQL de l'ancienne base
echo Étape 2: Import du fichier SQL de l'ancienne base...
if exist "%OLD_SQL_FILE%" (
    mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD% %NEW_DB_NAME% ^< "%OLD_SQL_FILE%"
    
    if %errorlevel% equ 0 (
        echo [OK] Fichier SQL importé avec succès!
    ) else (
        echo [ERREUR] Erreur lors de l'import du fichier SQL
        pause
        exit /b 1
    )
) else (
    echo [ERREUR] Fichier SQL introuvable: %OLD_SQL_FILE%
    pause
    exit /b 1
)

echo.

REM Étape 3: Vérifications
echo Étape 3: Vérification des données importées...
mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD% %NEW_DB_NAME% -e "SELECT 'customers' as table_name, COUNT(*) as count FROM customers UNION ALL SELECT 'contracts', COUNT(*) FROM contracts UNION ALL SELECT 'agency', COUNT(*) FROM agency;"

echo.

REM Étape 4: Conversion (optionnel)
set /p CONVERT="Voulez-vous convertir les données vers le format de l'application? (o/n) "
if /i "%CONVERT%"=="o" (
    echo Étape 4: Conversion des données...
    echo ATTENTION: Modifiez d'abord le script migrate-from-old-db.sql
    echo    pour utiliser '%NEW_DB_NAME%' comme base source
    pause
    
    REM Modifier temporairement le script pour utiliser la nouvelle base
    powershell -Command "(Get-Content '%MIGRATION_SCRIPT%') -replace 'gg1214_padme_finale', '%NEW_DB_NAME%' | Set-Content '%MIGRATION_SCRIPT%.tmp'"
    move /y "%MIGRATION_SCRIPT%.tmp" "%MIGRATION_SCRIPT%"
    
    mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD% ^< "%MIGRATION_SCRIPT%"
    
    if %errorlevel% equ 0 (
        echo [OK] Conversion terminée avec succès!
    ) else (
        echo [ERREUR] Erreur lors de la conversion
    )
)

echo.
echo ========================================
echo IMPORT TERMINÉ!
echo ========================================
pause





