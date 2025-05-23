import pool from '../../db.js';
import {reunion} from '../models/reunion.js';
   
export const reunionController ={
    //1 methode creer une reunion
    async createReunion(req,res){
        try{
            const phase_id = req.params.phase_id; 
            console.log('phase_id',phase_id);
const {nom_reunion,date,heure,lieu}=req.body;
if (!nom_reunion || !date || !phase_id) {
    return res.status(400).json({ error: "Champs manquants : nom_reunion, date, ou phase_id" });
  }

const nouvellereunion = new reunion(
    null,
    nom_reunion,
    date,
    heure,
    lieu,
    phase_id 
)
const reunionId = await reunion.create(nouvellereunion);
res.status(201).json({ message: "Réunion créée" });
} catch (err) {
     res.status(500).json({error:'erreur serveur'});
console.log("Erreur SQL:", err.message);
}},

//2 methode pour afficher les reunions d'une phase specifique
 async getReunion(req,res){
    try{
        const phase_id=req.params.phase_id;
        const reunions= await reunion.getallByphaseId(phase_id)
        res.status(200).json(reunions);

    }catch(err){
        res.status(500).json({ error: 'Erreur serveur' });
        console.log("Erreur SQL:", err.message);
    }
 },

 // 3eme methode  pour supprimer une reunion 
 async deleteReunion(req, res) {
    try {
        const reunionId = req.params.reunionId;
        console.log('id reunion',reunionId)
        const phaseId = req.params.phaseId;
        console.log('id phase',phaseId)
        const success = await reunion.delete(reunionId, phaseId);
        if (success) {
            res.status(200).json({ message: "Réunion supprimée" });
        } else {
            res.status(404).json({ error: "Réunion non trouvée" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log("Erreur SQL:", err.message);
    }
    }

}