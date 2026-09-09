-- Script de réinitialisation des statistiques après déploiement
-- Exécutez ce script UNE SEULE FOIS après le déploiement en production
-- pour remettre les compteurs à zéro

-- ATTENTION: Ce script supprime TOUTES les données utilisateur!
-- Ne l'exécutez qu'une seule fois après le premier déploiement.

-- Désactiver les contraintes de clé étrangère temporairement
BEGIN;

-- Supprimer les données dans l'ordre (enfants d'abord, parents ensuite)
DELETE FROM signalement_likes;
DELETE FROM sos_alerts;
DELETE FROM emergency_contacts;
DELETE FROM user_locations;
DELETE FROM otp_codes;
DELETE FROM sessions;
DELETE FROM signalements;
DELETE FROM users;

-- Réinitialiser les séquences si nécessaire (pour les IDs auto-incrémentés)
-- Note: Pas nécessaire si vous utilisez des UUIDs

COMMIT;

-- Vérification
SELECT 'Signalements' as table_name, COUNT(*) as count FROM signalements
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'SOS Alerts', COUNT(*) FROM sos_alerts
UNION ALL
SELECT 'Signalement Likes', COUNT(*) FROM signalement_likes;
