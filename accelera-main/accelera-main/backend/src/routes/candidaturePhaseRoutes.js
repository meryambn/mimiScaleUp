import express from 'express';
import { CandidaturePhaseController } from '../controllers/candidaturePhaseController.js';

const router = express.Router();

// Méthode unifiée pour avancer une équipe ou une startup
router.post('/phases/avancer', CandidaturePhaseController.avancerPhaseUnified);

// Route pour obtenir la phase actuelle d'une candidature
router.get('/current/:candidatureId', CandidaturePhaseController.getCurrentPhase);

// Déclarer un gagnant (POST)
router.post('/phases/declarer-gagnant', CandidaturePhaseController.declarerGagnantPhase);

// Obtenir le gagnant d'un programme
router.get('/programme/:programmeId/gagnant', CandidaturePhaseController.getProgrammeWinner);

export default router;
