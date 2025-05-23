import { utilisateur } from '../models/utilisateurs.js';
import { Mentor } from '../models/mentors.js';

export const mentorProfileController = {
    // Method to display a mentor's profile
    async profileMentor(req, res) {
        try {
            // Get user ID from request parameters
            const userId = req.params.userId;
            console.log("ID reçu :", userId);

            // Check if the user exists
            const user = await utilisateur.findById(userId);
            console.log("Utilisateur trouvé :", user);
            if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

            // Check if the mentor exists (user might exist but not be a mentor)
            console.log("Recherche du mentor avec l'ID utilisateur:", userId);
            try {
                const mentor = await Mentor.findByUserId(userId);
                console.log("Mentor trouvé :", mentor);
                if (!mentor) return res.status(404).json({ error: 'Profil mentor non trouvé' });

                // Build the response data
                const data = {
                    nom: mentor.nom,
                    prenom: mentor.prenom,
                    email: user.email,
                    telephone: user.telephone,
                    profession: mentor.profession || '',
                    date_creation: user.date_creation
                };

                // Return the mentor profile data
                res.status(200).json(data);
            } catch (mentorErr) {
                console.error("Erreur lors de la recherche du mentor:", mentorErr);
                return res.status(500).json({ error: 'Erreur lors de la recherche du profil mentor' });
            }
        } catch (err) {
            console.error("Erreur détaillée :", err);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
};