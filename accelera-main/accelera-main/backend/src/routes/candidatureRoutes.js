import express from 'express';
import { CandidatureController } from '../controllers/candidatureController.js';

const router = express.Router();

// Créer une équipe
router.post("/create",  CandidatureController.creerCandidature);

// Récupérer les détails d'une équipe
router.get("/:id", CandidatureController.getequipe);

// Récupérer les membres d'une équipe
router.get("/:id/membres", CandidatureController.getequipemembers);

// Route pour supprimer une candidature
router.delete('/:id', CandidatureController.supprimerCandidature);

/* Lier une soumission à une équipe
router.post("/:candidatureId/soumissions",  CandidatureController.lierSoumission);
*/
export default router;