# Guide de Migration - Ancienne Base vers Nouvelle Base

Ce guide explique comment migrer les données de l'ancienne base de données (`gg1214_padme_finale`) vers la nouvelle base (`fnda_node`).

## 📋 Prérequis

1. **Accès aux deux bases de données** :
   - Ancienne base : `gg1214_padme_finale` (ou le nom de votre ancienne base)
   - Nouvelle base : `fnda_node`

2. **Vérifications préalables** :
   - La nouvelle base doit avoir toutes les tables créées (via TypeORM migrations)
   - Les tables de référence doivent être peuplées :
     - `periodicite` (au moins les périodicités PADME)
     - `nature_credits` (id=1 pour AMORT, id=2 pour Hors Convention)
     - `contract_state` (au moins un état avec id=1)
     - `products` (les produits doivent exister)
     - `type_customer` (les types de clients doivent exister)

## 🚀 Étapes de Migration

### Étape 1 : Sauvegarde

**IMPORTANT** : Faire une sauvegarde complète de la nouvelle base avant de commencer !

```bash
mysqldump -u root -p fnda_node > backup_fnda_node_$(date +%Y%m%d_%H%M%S).sql
```

### Étape 2 : Vérification des tables de référence

Exécuter les requêtes de vérification dans le script (lignes 146-159) pour s'assurer que toutes les tables de référence existent et contiennent des données.

### Étape 3 : Modification du script

**IMPORTANT** : Avant d'exécuter le script, modifier le nom de la base source si nécessaire :

```sql
-- Ligne 193, 263, 300 : Remplacer 'gg1214_padme_finale' par le nom de votre ancienne base
FROM gg1214_padme_finale.customers old
FROM gg1214_padme_finale.contracts old
FROM gg1214_padme_finale.agency old
```

### Étape 4 : Exécution du script

```bash
mysql -u root -p fnda_node < backend/migrations/migrate-from-old-db.sql
```

Ou via MySQL Workbench / phpMyAdmin : copier-coller le contenu du script et l'exécuter.

### Étape 5 : Vérifications post-migration

Le script exécute automatiquement des vérifications (lignes 318-352) :
- Comptage des enregistrements migrés
- Vérification des dates invalides
- Vérification des taux invalides
- Vérification des capitales invalides
- Vérification des idNatureCredit

## 🔧 Conversions Automatiques

Le script effectue les conversions suivantes :

### Dates
- **Format DD/MM/YYYY** → **DATE** ou **DATETIME**
- Gestion des dates NULL ou invalides

### Types de crédit
- **'A'** ou **'AMORT'** → `idNatureCredit = 1`
- **'HC'** ou **'HORS_CONVENTION'** → `idNatureCredit = 2`
- Par défaut : `idNatureCredit = 1` (AMORT)

### Taux
- **VARCHAR** avec % → **DECIMAL(5,2)**
- Nettoyage automatique (suppression des %, espaces, etc.)
- Limitation à 0-100%

### Capital
- **VARCHAR(20)** → **BIGINT**
- Suppression des espaces et virgules
- Conversion en nombre non signé

### Champs ajoutés automatiquement
- `idContractState` : Par défaut `1` (à ajuster selon votre table)
- `updatedBy` / `deletedBy` : `NULL` (pas dans l'ancienne base)
- `contractType` : `'STANDARD'` par défaut
- `isActive` : `1` (true) par défaut
- `deleted_at` : `NULL` par défaut

## ⚠️ Points d'Attention

1. **Doublons** : Le script utilise `ON DUPLICATE KEY UPDATE` pour éviter les doublons. Les enregistrements existants seront mis à jour.

2. **Clés étrangères** : S'assurer que :
   - Les `idCustomer` existent dans la table `customers`
   - Les `idUser` existent dans la table `users`
   - Les `idProduct` existent dans la table `products`
   - Les `idAgency` existent dans la table `agency`
   - Les `idPeriodicite` existent dans la table `periodicite`

3. **idContractState** : Le script utilise `1` par défaut. Vérifier que cet ID correspond à un état valide dans votre table `contract_state`.

4. **keyCont** : Si manquant, généré automatiquement avec le format `KEY_{id}_{timestamp}`.

5. **Dates invalides** : Les dates qui ne peuvent pas être converties seront mises à `NULL`. Vérifier après la migration.

## 📊 Tables Migrées

- ✅ `customers` : Clients
- ✅ `contracts` : Contrats
- ✅ `agency` : Agences

## 🔍 Vérifications Post-Migration

Après la migration, exécuter ces requêtes pour vérifier :

```sql
-- Vérifier le nombre d'enregistrements
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM contracts;
SELECT COUNT(*) FROM agency;

-- Vérifier les dates NULL
SELECT COUNT(*) FROM customers WHERE birthdate IS NULL;
SELECT COUNT(*) FROM contracts WHERE dateEff IS NULL;

-- Vérifier les taux invalides
SELECT COUNT(*) FROM contracts WHERE taux IS NULL OR taux < 0 OR taux > 100;

-- Vérifier les capitales invalides
SELECT COUNT(*) FROM contracts WHERE capital IS NULL OR capital <= 0;
```

## 🐛 Résolution de Problèmes

### Erreur : "Table doesn't exist"
- Vérifier que toutes les tables de la nouvelle base existent
- Exécuter les migrations TypeORM si nécessaire

### Erreur : "Foreign key constraint fails"
- Vérifier que les tables de référence sont peuplées
- Vérifier que les IDs référencés existent

### Erreur : "Duplicate entry"
- Le script gère automatiquement les doublons avec `ON DUPLICATE KEY UPDATE`
- Si l'erreur persiste, vérifier les contraintes UNIQUE

### Dates NULL après migration
- Certaines dates dans l'ancienne base peuvent être invalides
- Vérifier manuellement et corriger si nécessaire

## 📝 Notes

- Les fonctions de conversion sont supprimées automatiquement à la fin du script
- Le script est idempotent : peut être exécuté plusieurs fois sans problème
- Les enregistrements existants seront mis à jour, pas dupliqués

## 📞 Support

En cas de problème, vérifier :
1. Les logs MySQL pour les erreurs détaillées
2. Les vérifications post-migration dans le script
3. La cohérence des données entre les deux bases

