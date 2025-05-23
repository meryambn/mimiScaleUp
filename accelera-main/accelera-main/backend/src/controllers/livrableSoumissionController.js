import { LivrableSoumission } from '../models/livrableSoumission.js';
import { liverable } from '../models/liverable.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Définir le répertoire de stockage des fichiers
const uploadsDir = path.join(__dirname, '../../uploads/livrables');

// Créer le répertoire s'il n'existe pas
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

export const livrableSoumissionController = {
    // Soumettre un livrable
    async soumettrelivrable(req, res) {
        try {
            // Vérifier si un fichier a été téléchargé
            if (!req.file) {
                return res.status(400).json({ error: "Aucun fichier n'a été téléchargé" });
            }

            const { livrable_id, candidature_id, programme_id, phase_id } = req.body;

            // Vérifier que tous les champs requis sont présents
            if (!livrable_id || !candidature_id || !programme_id || !phase_id) {
                return res.status(400).json({ error: "Champs manquants : livrable_id, candidature_id, programme_id, phase_id" });
            }

            // Vérifier si le livrable existe
            const livrables = await liverable.getallByphaseId(phase_id);
            const livrableExists = livrables.some(l => l.id == livrable_id);
            if (!livrableExists) {
                return res.status(404).json({ error: "Livrable non trouvé" });
            }

            // Vérifier si l'équipe a déjà soumis ce livrable
            const hasSubmitted = await LivrableSoumission.hasTeamSubmitted(livrable_id, candidature_id);
            if (hasSubmitted) {
                return res.status(400).json({ error: "Cette équipe a déjà soumis ce livrable" });
            }

            // Créer une nouvelle soumission de livrable
            const nouvelleSoumission = new LivrableSoumission(
                null,
                livrable_id,
                candidature_id,
                req.file.originalname,
                req.file.path,
                new Date()
            );

            // Enregistrer la soumission dans la base de données
            const soumission = await LivrableSoumission.create(nouvelleSoumission);

            // Envoyer des notifications aux admins et mentors
            console.log('Sending notifications to admins and mentors for livrable submission:', {
                livrable_id,
                candidature_id,
                programme_id
            });

            try {
                await LivrableSoumission.notifyAdminsAndMentors(livrable_id, candidature_id, programme_id);
                console.log('Notifications sent successfully');
            } catch (notifError) {
                console.error('Error sending notifications:', notifError);
                // Continue even if notifications fail
            }

            res.status(201).json({
                message: "Livrable soumis avec succès",
                soumission
            });
        } catch (err) {
            console.error("Erreur lors de la soumission du livrable:", err);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },

    // Récupérer toutes les soumissions pour un livrable spécifique
    async getSoumissionsByLivrable(req, res) {
        try {
            const livrableId = req.params.livrableId;

            // Vérifier si l'ID est un nombre valide
            if (isNaN(parseInt(livrableId))) {
                return res.status(400).json({ error: "ID de livrable invalide. L'ID doit être un nombre." });
            }

            const soumissions = await LivrableSoumission.getByLivrableId(livrableId);
            res.status(200).json(soumissions);
        } catch (err) {
            console.error("Erreur lors de la récupération des soumissions:", err);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },

    // Récupérer toutes les soumissions pour une équipe spécifique
    async getSoumissionsByEquipe(req, res) {
        try {
            const candidatureId = req.params.candidatureId;

            // Vérifier si l'ID est un nombre valide
            if (isNaN(parseInt(candidatureId))) {
                return res.status(400).json({ error: "ID d'équipe invalide. L'ID doit être un nombre." });
            }

            const soumissions = await LivrableSoumission.getByCandidatureId(candidatureId);
            res.status(200).json(soumissions);
        } catch (err) {
            console.error("Erreur lors de la récupération des soumissions:", err);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },

    // Télécharger un fichier soumis
    async telechargerFichier(req, res) {
        try {
            const soumissionId = req.params.soumissionId;

            // Vérifier si l'ID est un nombre valide
            if (isNaN(parseInt(soumissionId))) {
                return res.status(400).json({ error: "ID de soumission invalide. L'ID doit être un nombre." });
            }

            // Récupérer les informations sur la soumission
            const soumission = await LivrableSoumission.getById(soumissionId);

            if (!soumission) {
                return res.status(404).json({ error: "Soumission non trouvée" });
            }

            // Vérifier si le fichier existe
            if (!fs.existsSync(soumission.chemin_fichier)) {
                return res.status(404).json({ error: "Fichier non trouvé" });
            }

            // Envoyer le fichier
            res.download(soumission.chemin_fichier, soumission.nom_fichier);
        } catch (err) {
            console.error("Erreur lors du téléchargement du fichier:", err);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },

    // Mettre à jour le statut d'une soumission de livrable
    async updateStatus(req, res) {
        try {
            const soumissionId = req.params.soumissionId;

            // Vérifier si l'ID est un nombre valide
            if (isNaN(parseInt(soumissionId))) {
                return res.status(400).json({ error: "ID de soumission invalide. L'ID doit être un nombre." });
            }

            const { statut } = req.body;

            // Vérifier que le statut est fourni
            if (!statut) {
                return res.status(400).json({ error: "Le statut est requis" });
            }

            // Vérifier que le statut est valide
            if (!['en attente', 'valide', 'rejete'].includes(statut)) {
                return res.status(400).json({ error: "Statut invalide. Les valeurs possibles sont: en attente, valide, rejete" });
            }

            // Vérifier si la soumission existe
            const existingSoumission = await LivrableSoumission.getById(soumissionId);
            if (!existingSoumission) {
                return res.status(404).json({ error: "Soumission non trouvée" });
            }

            // Mettre à jour le statut
            const soumission = await LivrableSoumission.updateStatus(soumissionId, statut);

            // Envoyer des notifications aux participants
            await LivrableSoumission.notifyParticipants(soumissionId, statut);

            res.status(200).json({
                message: `Statut mis à jour avec succès à "${statut}"`,
                soumission
            });
        } catch (err) {
            console.error("Erreur lors de la mise à jour du statut:", err);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
};
