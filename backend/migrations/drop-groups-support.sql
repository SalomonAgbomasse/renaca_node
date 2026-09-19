-- Migration SQL pour retirer le support des Groupes et de leurs associations
-- (inverse de add-groups-support.sql)
--
-- Contexte : le système Group (restriction des natures de crédit visibles
-- par utilisateur) a été retiré du code applicatif (backend + frontend).
-- Ces 3 tables sont orphelines depuis ce retrait : plus aucune entité
-- TypeORM ne les référence, `synchronize: true` ne les touche plus.
--
-- ⚠️ IMPORTANT : faire une sauvegarde avant exécution, cette opération est irréversible.
--   mysqldump -u root -p fnda_node > backup_fnda_node_avant_drop_groups.sql
--
-- Ordre de suppression : tables enfants (clés étrangères vers `groups`) avant la table parente.

DROP TABLE IF EXISTS `user_groups`;
DROP TABLE IF EXISTS `group_nature_credits`;
DROP TABLE IF EXISTS `groups`;
