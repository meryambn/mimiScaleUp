
import pool from '../../db.js';
import { NotePhase} from '../models/notePhase.js';

export const notePhaseController = {
    async submitNoteFinale(req, res) {
        try {
            const { phase_id, candidature_id, mentor_id, note } = req.body;

            // 1. Validation de la note
            if (typeof note !== 'number' ) {
                return res.status(400).json({ 
                    error: "Note invalide doit etre un nombre" 
                });
            }

            // 2. Récupération du programme associé à la candidature
            const programmeQuery = await pool.query(
                `SELECT programme_id FROM app_schema.candidatures 
                WHERE id = $1`,
                [candidature_id]
            );
            
            if (programmeQuery.rows.length === 0) {
                return res.status(404).json({ 
                    error: "Candidature introuvable" 
                });
            }
            const programmeId = programmeQuery.rows[0].programme_id;

            // 3. Vérification de l'appartenance du mentor au programme
            const mentorAutorise = await pool.query(
                `SELECT 1 FROM app_schema.programme_mentors 
                WHERE programme_id = $1 AND mentor_id = $2`,
                [programmeId, mentor_id]
            );

            if (!mentorAutorise.rows.length) {
                return res.status(403).json({ 
                    error: "Accès refusé : Mentor non associé au programme" 
                });
            }

            // 4. Vérification de l'unicité de la note
            if (await NotePhase.existsForPhaseAndCandidature(phase_id, candidature_id)) {
    return res.status(409).json({ 
        error: "Une note existe déjà pour cette phase et candidature" 
    });
            }

            // 5. Création de la note
            const resultat = await NotePhase.create(
                phase_id,
                candidature_id,
                mentor_id,
                note
            );

            res.status(201).json(resultat);

        } catch (err) {
            console.error("Erreur lors de la soumission :", err);
            res.status(500).json({ 
                error: "Erreur serveur",
                details: err.message 
            });
        }
    },
    
    async getNoteFinale(req, res) {
    try {
        const { phase_id, candidature_id } = req.params;

        // Validation des IDs
        if (!phase_id || !candidature_id) {
            return res.status(400).json({ 
                error: "IDs de phase et candidature requis" 
            });
        }

        const note = await NotePhase.getByPhaseAndCandidature(phase_id, candidature_id);

        if (!note) {
            return res.status(404).json({ 
                error: "Aucune note trouvée pour cette combinaison phase/candidature" 
            });
        }

        res.status(200).json(note);

    } catch (err) {
        console.error("Erreur lors de la récupération :", err);
        res.status(500).json({ 
            error: "Erreur serveur",
            details: err.message 
        });
    }
}
    
};

