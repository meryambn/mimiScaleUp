import express from 'express';
import { noteController } from '../controllers/noteController.js';

const router = express.Router();
//route pour les reponses des equipes(rempli par equipe)
router.post('/reponsesEquipe',noteController.submitResponses);
//route pour afficher les reponses des equipes dun critere devaluation donc rempli par equipe (lequipe 3ndha le droit de remplir )
router.get('/:candidatureId/phases/:phaseId/reponses', noteController.getReponsesCandidaturePhase);
// route Valider ou modifier une réponse remplie par équipe
router.post('/valider-ou-modifier', noteController.validerOuModifierReponseEquipe)
// route pour les reponses des mentors(rempli par mentor)
router.post('/submit/mentor', noteController.submitMentorResponses);
//route pour recuperer les reponses rempli par un mentor
router.get( '/mentors/remplis/phase/:phase_id/candidature/:candidature_id',noteController.getMentorsFilledOnly);
//teste pour afficher les reponses modifier par le mentor
router.get('/reponses-validees/:candidature_id/:phaseId',noteController.getReponsesValides);
//route pour recuperer tout les reponses de un  mentor(modifier ou rempli par le mentor) un mentor hna pas importante mais blak nsha9oha ta3 mentor wahed wsh 3mer ou modifier tani
router.get('/mentor/all/:mentor_id/:candidature_id/:phase_id', noteController.getToutesReponsesMentor);
//had laroute fiha la methode li  elle fusionne les deux li rempli par mentors+ li modifiyahom le mentor(wela validathom)
router.get('/mentor/all/:candidature_id/:phase_id', noteController.getToutesReponsesMentors);
// lhna le#i 3amrhom el mentors wela modifiyahom mesah accessible par equipe
router.get('/equipe/:candidature_id/:phase_id',noteController.getReponsesMentorsPourEquipe);
export default router;