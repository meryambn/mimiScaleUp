import express from 'express';
import {soumissionController} from '../controllers/soumissionController.js'
const router = express.Router();

// Cette route est appelée quand une startup ou un particulier remplit un formulaire ya3mr
router.post('/create', soumissionController.createsoum);
// Route pour récupérer toutes les soumissions d'un programme
router.get('/programme/:programmeId', soumissionController.getSoumissionsByProgramme);
// Nouvelle route pour vérifier la soumission
router.get('/check', soumissionController.checkIfSubmitted);
//route pour afficher le form avec les qts et ses reponses
router.get('/:id', soumissionController.lireSoumissionAvecReponses);

export default router;