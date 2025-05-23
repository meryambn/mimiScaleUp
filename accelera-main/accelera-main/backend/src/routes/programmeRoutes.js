import express from 'express';
import { programmeController } from '../controllers/programmeController.js';
const router = express.Router();

// route pour creer un nouveau programme
router.post('/create', programmeController.createProgramme);
// route pour récupérer tous les programmes qui sont des modèles
router.get('/templates', programmeController.getTemplatePrograms);
// route pour récupérer tous les programmes
router.get('/all', programmeController.getAllPrograms);
// route qui affiche un programme par son id (ses infos+ses mentors)
router.get('/:id', programmeController.getProgrammeDetails);
//route pour ajouter un mentor a un programme
router.post('/:id/add-mentor', programmeController.addMentorToProgram);
//route pour la suppresion dun mentor
router.delete('/:programmeId/mentors/:mentorId',programmeController.delmentor)
//route pour modifier un programme
router.put('/:programmeId/update',programmeController.updateProgramme);

// route pour delete un programme complet avec ses phases,taches,criteres,livrable....
router.delete('/delete/:id', programmeController.deleteProgramme);
// route pour récupérer tous les programmes d'un mentor
router.get('/mentor/:mentorId', programmeController.getMentorPrograms);
// route pour mettre à jour le statut d'un programme
router.put('/:programmeId/status', programmeController.updateProgramStatus);
export default router;