import { tache } from '../models/tache.js'


export const tacheController={
    // 1 ere methode creation d'une tache 
    async createtache(req,res){
        try{

const {nom,description,date_decheance}=req.body;
const phase_id=req.params.phase_id;
console.log("id de la phase recu:",phase_id);
if (!nom || !date_decheance || !phase_id) {
    return res.status(400).json({ error: "Champs manquants : nom, date_echeance, ou phase_id" });
}
const nouvelleTache = new tache(
    null,
    nom,
    description,
    date_decheance,
    phase_id 
);

const tacheId = await tache.create(nouvelleTache);
res.status(201).json({ id: tacheId, message: "Tâche créée" });

        }catch(err){
            res.status(500).json({ error: err.message });
            console.log("Erreur SQL:", err.message);
        }
    },

 //2 eme methode pour supprimer une tache 
    async deleteTache(req, res) {
        try {
          const tacheId = req.params.tacheId;
          console.log("id de la tache recu:",tacheId);
          const phaseId = req.params.phaseId;
          console.log("id de la phase recu:",phaseId);
          const tacheSupprime = await tache.delete(tacheId, phaseId);
          if(tacheSupprime)
          res.status(200).json({
            message: "Tâche supprimée avec succès",
          });
          else{
            res.status(404).json({error:"tache non trouvee"});
          
            }
        }
          catch (err) {
            res.status(500).json({error:"erreur serveur "});
          }
        },

 //3eme methode pour afficher les taches d'une phase 
        async getTaches(req, res) {
            try {
              const phaseId = req.params.phase_id;
              const taches = await tache.getAllByPhaseId(phaseId);
              res.status(200).json(taches);
            } catch (err) {
              res.status(500).json({ error: err.message });
            }
          }
    }
        