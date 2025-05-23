import express from 'express';
import { formController} from '../controllers/formController.js';

const router = express.Router();
// route creer un form
router.post('/create/:programme_id', formController.createform);
//route  recupere un form avec ses qst associer am3ah (dkhelo)
router.get('/programmes/:programme_id/form', formController.getFullForm);
// route delete le form+ les qsts
router.delete('/delete/:programme_id', formController.deleteForm);

export default router;