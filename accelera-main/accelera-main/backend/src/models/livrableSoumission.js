import pool from '../../db.js';
import { Notification } from './notification.js';

// Classe représentant le modèle de données pour les soumissions de livrables
export class LivrableSoumission {
    constructor(id, livrable_id, candidature_id, nom_fichier, chemin_fichier, date_soumission, statut = 'en attente') {
        this.id = id;
        this.livrable_id = livrable_id;
        this.candidature_id = candidature_id;
        this.nom_fichier = nom_fichier;
        this.chemin_fichier = chemin_fichier;
        this.date_soumission = date_soumission || new Date();
        this.statut = statut;
    }

    // Créer une nouvelle soumission de livrable
    static async create(livrableSoumission) {
        try {
            const { rows } = await pool.query(
                `INSERT INTO app_schema.livrable_soumissions
                (livrable_id, candidature_id, nom_fichier, chemin_fichier, date_soumission, statut)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [
                    livrableSoumission.livrable_id,
                    livrableSoumission.candidature_id,
                    livrableSoumission.nom_fichier,
                    livrableSoumission.chemin_fichier,
                    livrableSoumission.date_soumission,
                    livrableSoumission.statut
                ]
            );

            return rows[0];
        } catch (error) {
            console.error('Erreur lors de la création de la soumission de livrable:', error);
            throw error;
        }
    }

    // Récupérer une soumission de livrable par son ID
    static async getById(id) {
        try {
            const { rows } = await pool.query(
                `SELECT * FROM app_schema.livrable_soumissions WHERE id = $1`,
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Erreur lors de la récupération de la soumission de livrable:', error);
            throw error;
        }
    }

    // Récupérer toutes les soumissions pour un livrable spécifique
    static async getByLivrableId(livrableId) {
        try {
            const { rows } = await pool.query(
                `SELECT ls.*, c.nom_equipe, l.nom as nom_livrable, l.description as description_livrable, l.date_echeance
                FROM app_schema.livrable_soumissions ls
                JOIN app_schema.livrables l ON ls.livrable_id = l.id
                JOIN app_schema.candidatures c ON ls.candidature_id = c.id
                WHERE ls.livrable_id = $1
                ORDER BY ls.date_soumission DESC`,
                [livrableId]
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des soumissions pour le livrable:', error);
            throw error;
        }
    }

    // Récupérer toutes les soumissions pour une équipe (candidature) spécifique
    static async getByCandidatureId(candidatureId) {
        try {
            const { rows } = await pool.query(
                `SELECT ls.*, l.nom as nom_livrable, l.description as description_livrable, l.date_echeance
                FROM app_schema.livrable_soumissions ls
                JOIN app_schema.livrables l ON ls.livrable_id = l.id
                WHERE ls.candidature_id = $1
                ORDER BY ls.date_soumission DESC`,
                [candidatureId]
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des soumissions pour l\'équipe:', error);
            throw error;
        }
    }

    // Vérifier si une équipe a déjà soumis un livrable spécifique
    static async hasTeamSubmitted(livrableId, candidatureId) {
        try {
            const { rows } = await pool.query(
                `SELECT COUNT(*) as count FROM app_schema.livrable_soumissions
                WHERE livrable_id = $1 AND candidature_id = $2`,
                [livrableId, candidatureId]
            );
            return parseInt(rows[0].count) > 0;
        } catch (error) {
            console.error('Erreur lors de la vérification de soumission:', error);
            throw error;
        }
    }

    // Mettre à jour le statut d'une soumission de livrable
    static async updateStatus(soumissionId, nouveauStatut) {
        try {
            // Vérifier que le statut est valide
            if (!['en attente', 'valide', 'rejete'].includes(nouveauStatut)) {
                throw new Error('Statut invalide. Les valeurs possibles sont: en attente, valide, rejete');
            }

            const { rows } = await pool.query(
                `UPDATE app_schema.livrable_soumissions
                SET statut = $1
                WHERE id = $2
                RETURNING *`,
                [nouveauStatut, soumissionId]
            );

            if (rows.length === 0) {
                throw new Error('Soumission non trouvée');
            }

            return rows[0];
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            throw error;
        }
    }

    // Notifier les participants du changement de statut d'un livrable
    static async notifyParticipants(soumissionId, nouveauStatut) {
        try {
            // Récupérer les informations sur la soumission
            const { rows: soumissionRows } = await pool.query(
                `SELECT ls.*, l.nom as nom_livrable, c.nom_equipe, p.nom as phase_nom, pr.nom as programme_nom
                FROM app_schema.livrable_soumissions ls
                JOIN app_schema.livrables l ON ls.livrable_id = l.id
                JOIN app_schema.candidatures c ON ls.candidature_id = c.id
                JOIN app_schema.phase p ON l.phase_id = p.id
                JOIN app_schema.programme pr ON p.programme_id = pr.id
                WHERE ls.id = $1`,
                [soumissionId]
            );

            if (soumissionRows.length === 0) {
                throw new Error('Soumission non trouvée');
            }

            const soumission = soumissionRows[0];

            // Récupérer les membres de l'équipe (via les soumissions liées à la candidature)
            const { rows: membresRows } = await pool.query(
                `SELECT s.utilisateur_id, s.role
                FROM app_schema.candidatures_membres cm
                JOIN app_schema.soumissions s ON cm.soumission_id = s.id
                WHERE cm.candidatures_id = $1`,
                [soumission.candidature_id]
            );

            // Créer un message en fonction du statut
            let title, message;

            switch (nouveauStatut) {
                case 'valide':
                    title = 'Livrable validé';
                    message = `Votre livrable "${soumission.nom_livrable}" pour la phase "${soumission.phase_nom}" du programme "${soumission.programme_nom}" a été validé.`;
                    break;
                case 'rejete':
                    title = 'IMPORTANT: Livrable rejeté';
                    message = `Votre livrable "${soumission.nom_livrable}" pour la phase "${soumission.phase_nom}" du programme "${soumission.programme_nom}" a été rejeté. Veuillez soumettre une nouvelle version améliorée dès que possible.`;
                    break;
                default:
                    title = 'Statut du livrable mis à jour';
                    message = `Le statut de votre livrable "${soumission.nom_livrable}" pour la phase "${soumission.phase_nom}" du programme "${soumission.programme_nom}" a été mis à jour à "${nouveauStatut}".`;
            }

            // Envoyer des notifications à tous les membres de l'équipe
            for (const membre of membresRows) {
                await Notification.create({
                    user_id: membre.utilisateur_id,
                    user_role: membre.role,
                    type: 'statut_livrable',
                    title: title,
                    message: message,
                    related_id: soumissionId
                });
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de l\'envoi des notifications aux participants:', error);
            throw error;
        }
    }

    // Envoyer une notification aux admins et mentors quand un livrable est soumis
    static async notifyAdminsAndMentors(livrableId, candidatureId, programmeId) {
        try {
            // Récupérer les informations sur le livrable
            const { rows: livrableRows } = await pool.query(
                `SELECT l.nom, p.id as phase_id, p.nom as phase_nom
                FROM app_schema.livrables l
                JOIN app_schema.phase p ON l.phase_id = p.id
                WHERE l.id = $1`,
                [livrableId]
            );

            if (livrableRows.length === 0) {
                throw new Error('Livrable non trouvé');
            }

            const livrable = livrableRows[0];

            // Récupérer les informations sur l'équipe
            const { rows: equipeRows } = await pool.query(
                `SELECT nom_equipe FROM app_schema.candidatures WHERE id = $1`,
                [candidatureId]
            );

            if (equipeRows.length === 0) {
                throw new Error('Équipe non trouvée');
            }

            const equipe = equipeRows[0];

            // Récupérer les informations sur le programme
            const { rows: programmeRows } = await pool.query(
                `SELECT nom FROM app_schema.programme WHERE id = $1`,
                [programmeId]
            );

            if (programmeRows.length === 0) {
                throw new Error('Programme non trouvé');
            }

            const programme = programmeRows[0];

            // Récupérer les admins associés au programme
            const { rows: adminRows } = await pool.query(
                `SELECT admin_id as utilisateur_id FROM app_schema.programme WHERE id = $1 AND admin_id IS NOT NULL`,
                [programmeId]
            );

            console.log('Admin rows for program:', programmeId, adminRows);

            // Si aucun admin n'est trouvé, utiliser l'admin par défaut (ID 1)
            if (adminRows.length === 0) {
                console.log('No admins found for program, using default admin (ID 1)');
                adminRows.push({ utilisateur_id: 1 });
            }

            // Récupérer les mentors associés au programme
            const { rows: mentorRows } = await pool.query(
                `SELECT mentor_id FROM app_schema.programme_mentors WHERE programme_id = $1`,
                [programmeId]
            );

            console.log('Mentor rows for program:', programmeId, mentorRows);

            // Si aucun mentor n'est trouvé, ne pas envoyer de notifications aux mentors
            if (mentorRows.length === 0) {
                console.log('No mentors found for program', programmeId);
            }

            // Créer et envoyer des notifications aux admins
            for (const admin of adminRows) {
                await Notification.create({
                    user_id: admin.utilisateur_id,
                    user_role: 'mentor', // Les admins ont le rôle 'mentor' dans la table notifications
                    type: 'livrable_soumis',
                    title: 'Nouveau livrable soumis',
                    message: `L'équipe ${equipe.nom_equipe} a soumis le livrable "${livrable.nom}" pour la phase "${livrable.phase_nom}" du programme "${programme.nom}"`,
                    related_id: livrableId
                });
            }

            // Créer et envoyer des notifications aux mentors
            for (const mentor of mentorRows) {
                await Notification.create({
                    user_id: mentor.mentor_id,
                    user_role: 'mentor',
                    type: 'livrable_soumis',
                    title: 'Nouveau livrable soumis',
                    message: `L'équipe ${equipe.nom_equipe} a soumis le livrable "${livrable.nom}" pour la phase "${livrable.phase_nom}" du programme "${programme.nom}"`,
                    related_id: livrableId
                });
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de l\'envoi des notifications:', error);
            throw error;
        }
    }
}
