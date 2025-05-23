import express from 'express';
import { ProgrammeSoumissionController } from '../controllers/programmeSoumissionController.js';

const router = express.Router(); // Crée un routeur Express

// Route POST pour ajouter une startup à un programme
router.post('/ajouter', ProgrammeSoumissionController.ajouterSoumissionAuProgramme);
//Route get pour afficher les equipe et les startups ajouter dans un programme
router.get('/get/:programmeId',ProgrammeSoumissionController. getStartupsAndTeams);
export default router; 