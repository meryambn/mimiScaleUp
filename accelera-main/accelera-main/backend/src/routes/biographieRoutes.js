import express from 'express';
import pool from '../../db.js';

const router = express.Router();

// Route pour récupérer la biographie
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            'SELECT biographie FROM app_schema.utilisateur WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json({ biographie: result.rows[0].biographie });
    } catch (error) {
        console.error('Erreur lors de la récupération de la biographie:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour mettre à jour la biographie
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { biographie } = req.body;

        // Vérifier si l'utilisateur existe déjà une biographie
        const checkResult = await pool.query(
            'SELECT biographie FROM app_schema.utilisateur WHERE id = $1',
            [userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Si l'utilisateur a déjà une biographie, on ne permet pas la modification
        if (checkResult.rows[0].biographie) {
            return res.status(400).json({ message: 'La biographie ne peut être modifiée qu\'une seule fois' });
        }

        // Mettre à jour la biographie
        const result = await pool.query(
            'UPDATE app_schema.utilisateur SET biographie = $1 WHERE id = $2 RETURNING biographie',
            [biographie, userId]
        );

        res.json({ 
            message: 'Biographie ajoutée avec succès',
            biographie: result.rows[0].biographie 
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la biographie:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

export default router; 