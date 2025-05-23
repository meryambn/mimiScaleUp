import express from 'express';
import { notePhaseController } from '../controllers/notePhaseController.js';

const router = express.Router();

// Soumission d'une note finale
router.post('/phases/notes', notePhaseController.submitNoteFinale);
// Récupération de la note finale unique
router.get('/phases/:phase_id/notes/:candidature_id', notePhaseController.getNoteFinale);

export default router;