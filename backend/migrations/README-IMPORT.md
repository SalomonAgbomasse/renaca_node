# Guide d'Import - Ancienne Base vers Nouvelle Base

Ce guide explique comment créer une nouvelle base de données et y importer le fichier SQL de l'ancienne base.

## 📋 Prérequis

1. **MySQL/MariaDB installé** et accessible en ligne de commande
2. **Fichier SQL de l'ancienne base** : `backend/Sql/gg1214_padme_finale (2) (1).sql`
3. **Accès root** à MySQL (ou un utilisateur avec les permissions nécessaires)

## 🚀 Méthode 1 : Import Manuel (Recommandé)

### Étape 1 : Créer la nouvelle base de données

Exécuter le script `create-new-db-and-import.sql` :

```bash
# Linux/Mac
mysql -u root -p < backend/migrations/create-new-db-and-import.sql

# Windows (PowerShell)
mysql -u root -p < backend\migrations\create-new-db-and-import.sql
```

Ou via MySQL Workbench/phpMyAdmin :
1. Ouvrir le fichier `create-new-db-and-import.sql`
2. Exécuter le script

Cela créera une nouvelle base nommée `fnda_node_import`.

### Étape 2 : Importer le fichier SQL de l'ancienne base

#### Option A : Via ligne de commande

```bash
# Linux/Mac
mysql -u root -p fnda_node_import < "backend/Sql/gg1214_padme_finale (2) (1).sql"

# Windows (PowerShell)
mysql -u root -p fnda_node_import < "backend\Sql\gg1214_padme_finale (2) (1).sql"
```

#### Option B : Via MySQL Workbench

1. Ouvrir MySQL Workbench
2. Se connecter au serveur MySQL
3. Sélectionner la base `fnda_node_import`
4. Menu : **Server** → **Data Import**
5. Sélectionner **Import from Self-Contained File**
6. Choisir le fichier : `backend/Sql/gg1214_padme_finale (2) (1).sql`
7. Cliquer sur **Start Import**

#### Option C : Via phpMyAdmin

1. Ouvrir phpMyAdmin
2. Sélectionner la base `fnda_node_import` dans le menu de gauche
3. Cliquer sur l'onglet **Importer**
4. Cliquer sur **Choisir un fichier** et sélectionner `gg1214_padme_finale (2) (1).sql`
5. Cliquer sur **Exécuter**

### Étape 3 : Vérifier l'import

Exécuter ces requêtes pour vérifier que les données sont bien importées :

```sql
USE fnda_node_import;

-- Vérifier les tables
SHOW TABLES;

-- Compter les enregistrements
SELECT 'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'agency', COUNT(*) FROM agency;
```

## 🤖 Méthode 2 : Import Automatique (Script)

### Linux/Mac

1. Rendre le script exécutable :
```bash
chmod +x backend/migrations/import-and-convert.sh
```

2. Modifier les variables dans le script si nécessaire :
```bash
NEW_DB_NAME="fnda_node_import"
MYSQL_USER="root"
MYSQL_PASSWORD="votre_mot_de_passe"
```

3. Exécuter le script :
```bash
./backend/migrations/import-and-convert.sh
```

### Windows

1. Ouvrir PowerShell ou CMD en tant qu'administrateur
2. Naviguer vers le répertoire du projet
3. Modifier les variables dans `import-and-convert.bat` si nécessaire
4. Exécuter le script :
```cmd
backend\migrations\import-and-convert.bat
```

## 🔄 Étape 4 : Conversion vers le format de l'application (Optionnel)

Si vous voulez convertir les données au format de la nouvelle application :

1. **Modifier le script de migration** `migrate-from-old-db.sql` :
   - Remplacer `gg1214_padme_finale` par `fnda_node_import` (lignes 193, 263, 300)
   - Modifier `USE fnda_node;` par `USE fnda_node_import;` (ligne 10)

2. **Exécuter le script de migration** :
```bash
mysql -u root -p < backend/migrations/migrate-from-old-db.sql
```

⚠️ **ATTENTION** : Cette étape convertira les données dans la même base. Si vous voulez les convertir vers une autre base (comme `fnda_node`), modifiez le script en conséquence.

## 📊 Vérifications Post-Import

Après l'import, vérifier :

```sql
USE fnda_node_import;

-- Vérifier la structure des tables principales
DESCRIBE customers;
DESCRIBE contracts;
DESCRIBE agency;

-- Vérifier quelques enregistrements
SELECT * FROM customers LIMIT 5;
SELECT * FROM contracts LIMIT 5;
SELECT * FROM agency LIMIT 5;

-- Vérifier les formats de dates
SELECT id, lastname, birthdate, created_at FROM customers LIMIT 10;
SELECT id, reference, dateEff, dateEch1 FROM contracts LIMIT 10;
```

## ⚠️ Points d'Attention

1. **Taille du fichier** : Le fichier SQL fait plus de 65 000 lignes. L'import peut prendre plusieurs minutes.

2. **Erreurs d'import** : Si vous rencontrez des erreurs :
   - Vérifier que MySQL a assez de mémoire (`max_allowed_packet`)
   - Vérifier les contraintes de clés étrangères
   - Vérifier les encodages (UTF-8)

3. **Doublons** : Si la base existe déjà, vous pouvez avoir des erreurs de doublons. Dans ce cas :
   - Supprimer la base et la recréer
   - Ou modifier le script pour gérer les doublons

4. **Permissions** : Assurez-vous d'avoir les permissions nécessaires :
   - `CREATE DATABASE`
   - `DROP DATABASE` (si vous recréez)
   - `INSERT`, `UPDATE`, `SELECT` sur toutes les tables

## 🐛 Résolution de Problèmes

### Erreur : "Unknown database"
- Vérifier que la base `fnda_node_import` a été créée
- Exécuter `create-new-db-and-import.sql` d'abord

### Erreur : "File too large"
- Augmenter `max_allowed_packet` dans MySQL :
```sql
SET GLOBAL max_allowed_packet=1073741824; -- 1GB
```

### Erreur : "Access denied"
- Vérifier les permissions de l'utilisateur MySQL
- Utiliser `root` ou un utilisateur avec les permissions nécessaires

### Erreur : "Duplicate entry"
- Les données existent déjà dans la base
- Supprimer la base et la recréer, ou modifier le script pour gérer les doublons

## 📝 Notes

- La base `fnda_node_import` est créée avec l'encodage `utf8mb4_unicode_ci`
- Toutes les données de l'ancienne base seront importées telles quelles
- Pour convertir au format de la nouvelle application, utiliser `migrate-from-old-db.sql`
- La base importée est indépendante de la base de production `fnda_node`

## 📞 Support

En cas de problème :
1. Vérifier les logs MySQL
2. Vérifier les erreurs dans la console
3. Vérifier que le fichier SQL n'est pas corrompu
4. Essayer d'importer table par table si nécessaire





