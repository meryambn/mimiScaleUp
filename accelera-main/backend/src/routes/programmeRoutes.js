import express from 'express';
import { programmeController } from '../controllers/programmeController.js';
const router = express.Router();

// route pour creer un nouveau programme
router.post('/create', programmeController.createProgramme);
// route qui affiche un programme par son id (ses infos+ses mentors)
router.get('/:id', programmeController.getProgrammeDetails);
//route pour ajouter un mentor a un programme
router.post('/:id/add-mentor', programmeController.addmetor);
//route pour la suppresion dun mentor
router.delete('/:programmeId/mentors/:mentorId',programmeController.delmentor)
//route pour modifier un programme
router.put('/:programmeId/update',programmeController.updateProgramme);
export default router;