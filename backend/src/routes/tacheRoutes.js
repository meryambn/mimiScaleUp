import express from 'express';
import {tacheController } from '../controllers/tacheController.js';
 const router = express.Router();
//route pour creer une tache dans une phase 
router.post('/create/:phase_id',tacheController.createtache);
//route pour supprimer une tache d'une phase
router.delete('/delete/:phaseId/:tacheId',tacheController.deleteTache)
//route pour afficher les taches d'une phase
router.get('/get/:phase_id', tacheController.getTaches);

 export default router;