import express from 'express';
import { reunionController } from '../controllers/reunionController.js';
const router = express.Router();

// route pour creer une reunion pour une phase 
router.post('/create/:phaseId', reunionController.createReunion);
//route pour recuperer les reunions d'une phase specifique 
router.get('/get/:phaseId', reunionController.getReunion); 
//route pour suppresion de reunion d'une phase   
router.delete('/delete/:phaseId/:reunionId', reunionController.deleteReunion);
export default router;
