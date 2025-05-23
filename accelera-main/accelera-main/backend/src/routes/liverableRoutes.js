import express from 'express';
import { liverableController} from '../controllers/liverableController.js';
const router = express.Router();

  // Route  pour créer un nouveau livrable associé à une phase spécifique
router.post('/create/:phaseId', liverableController.createliverable);
// Route pour supprimer un livrable spécifique dans une phase
router.delete('/delete/:phaseId/:liverableId',liverableController.deletelivrable);
//Route pour récupérer tous les livrables d'une phase spécifique
router.get('/get/:phaseId', liverableController.getLiverables)
export default router;