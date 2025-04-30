import express from 'express';
import { critereController } from '../controllers/critereController.js';


const router = express.Router();
//route pour creer un critere dans une phase
router.post('/create/:phaseId',critereController.createCritere);
//route pour supprimer un critere d'une phase
router.delete('/delete/:phaseId/:critereId',critereController.deleteCritere)
//route  pour afficher criteres
router.get('/get/:phaseId', critereController.getCritere); 
export default router;