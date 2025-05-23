import pool from '../../db.js';
import { critere } from '../models/critere.js';

export const critereController={

    // 1ere methode pour creer un criteres devaluation
    async createCritere(req,res){
        try{
            const phaseId = req.params.phaseId; 

            console.log('phaseId',phaseId);
            const{nom_critere, type,poids, accessible_mentors,accessible_equipes,rempli_par,necessite_validation}=req.body;
            console.log('le type est :',type)
            console.log('accessible mentors',)
            const allowedStages = ['numerique', 'etoiles', 'oui_non', 'liste_deroulante'];
            if (!allowedStages.includes(type)) {
                return res.status(400).json({ error: "type invalide" });
              }

const nouveaucritere= new critere(
    null,
    nom_critere,
    type,
    poids, 
 accessible_mentors,
    accessible_equipes,
    rempli_par,
    necessite_validation,
    phaseId
)
if (!nom_critere || !type || !poids || !rempli_par) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
}

await critere.create(nouveaucritere);
res.status(201).json({ message: "critere créée" });
} catch (err) {
    console.error("Erreur complète:", err);
    res.status(500).json({ 
        error: "Erreur serveur",
        details: err.message 
    });
}
},
//2eme methode pour supprimer un critere dune phase
async deleteCritere(req, res) {
    try {
        const critereId= req.params.critereId;
        console.log('id reunion',critereId)
        const phaseId = req.params.phaseId;
        console.log('id phase',phaseId)
        const success = await critere.delete(critereId, phaseId);
        if (success) {
            res.status(200).json({ message: "critere supprimée" });
        } else {
            res.status(404).json({ error: "critere non trouvée" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log("Erreur SQL:", err.message);
    }
    },
    async getCritere(req,res){
        try{
            const phaseId=req.params.phaseId;
            const criteres= await critere.getallByphaseId(phaseId)
            if (criteres.length === 0) {
                return res.status(404).json({ message: "Aucun critère trouvé" });}
            res.status(200).json(criteres);
    
        }catch(err){
            res.status(500).json({ error: 'Erreur serveur' });
            console.log("Erreur SQL:", err.message);
        }
     },

};
