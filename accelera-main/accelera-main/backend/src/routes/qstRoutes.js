import express from 'express';
import { questionController} from '../controllers/qstController.js';
const router = express.Router();
 //hadi route pour creer une qst dans un programme
router.post('/create/:programmeid', questionController.createquestion);
//route bach tu supprime une qst men un programme
router.delete('/delete/:programmeid/:questionId', questionController.deletequestion);
//route bach tu modifie une qst
router.put('/update/:programmeid/:questionId', questionController.updatequestion);
//route bach tu recup toute les qst dun programme
router.get('/get/:programmeid', questionController.getquestion);
  
export default router;  