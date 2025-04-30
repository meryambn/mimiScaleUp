import express from 'express';
import { questionController} from '../controllers/qstController.js';
const router = express.Router();

router.post('/create/:programmeid', questionController.createquestion);
router.delete('/delete/:programmeid/:questionId', questionController.deletequestion);
router.put('/update/:programmeid/:questionId', questionController.updatequestion);
router.get('/get/:programmeid', questionController.getquestion);
  
export default router;  