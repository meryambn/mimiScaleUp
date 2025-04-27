import express from 'express';
import { profileController } from '../controllers/StartupprofileController.js';
import { profileControllerParticulier } from '../controllers/particulierProfilController.js';

const router = express.Router();
//route pour afficher profil startup
router.get('/startup/:userId', profileController.profilstartup);
//cest la route pour ajouter des membres d'equipe
router.post('/startup/:userId/equipe',profileController.addEquipe);
// cest la route pour ajouter un stage pour une startup
router.post('/startup/:userId/stage', profileController. addstage);

//hnaya route afficher profil particulier
router.get('/particulier/:userId',profileControllerParticulier.profileparticulier);
export default router;