import express from 'express';
import { phaseController } from '../controllers/phaseControllers.js';
const router = express.Router();
//route pour creer une phase dans un programme 
router.post('/create/:programmeId',phaseController.addphase);
//routes pour recuperer les phases d'un programme (afficher les phases dans l'inteface)
router.get('/:programmeId', phaseController.getPhases);
//route pour supprimer une phase
router.delete('/:programmeId/delete/:phaseId',phaseController.deletephase);
export default router;