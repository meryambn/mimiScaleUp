import pool from '../../db.js'; 
import {liverable} from '../models/liverable.js';


export const liverableController ={
    //1 ere methode creation dun liverable
    async createliverable(req,res){
    try{
        const phaseId = req.params.phaseId;
           console.log('phaseId',phaseId);
const {nom,description,date_echeance,types_fichiers}=req.body;
if (!nom || !description || !date_echeance||!types_fichiers) {
    return res.status(400).json({ error: "Champs manquants : nom, description, date_echeance, types_fichiers" });
  }
  //recupere la chaine d'extensions fournie
  const typesFichiersArray = types_fichiers
  //Découpe la chaîne en tableau separe par des virgules
    .split(',')
    //Supprime les espaces
    .map(type => type.trim()) 
    //Filtre les éléments commençant par un point
    .filter(type => type.startsWith('.')); // Garde uniquement les extensions valides
//Vérifie si le tableau est vide après le filtrage.
if (typesFichiersArray.length === 0) {
    return res.status(400).json({ error: "Extensions invalides (ex: .pdf, .docx)" });
}


const nouveauliverable= new liverable(
    null,
    nom,
    description,
    date_echeance,
    typesFichiersArray,
    phaseId 
)
await liverable.create(nouveauliverable);
res.status(201).json({ message: "liverable créée" });
} catch (err) {
     res.status(500).json({error:'erreur serveur'});
console.log("Erreur SQL:", err.message);
 }
},

//2eme methode suppression d'un liverable 
async deletelivrable(req, res) {
    try {
        const liverableId = req.params.liverableId;
        console.log('id reunion',liverableId)
        const phaseId = req.params.phaseId;
        console.log('id phase',phaseId)
        const success = await liverable.delete(liverableId, phaseId);
        if (success) {
            res.status(200).json({ message: "liverable supprimée" });
        } else {
            res.status(404).json({ error: "liverable non trouvée" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log("Erreur SQL:", err.message);
    }
    },
    //3eme methode recupere tous les livrables d'une phase
    async getLiverables(req, res) {
        try {
            const phaseId = req.params.phaseId;
            const livrables = await liverable.getallByphaseId(phaseId);
            res.status(200).json(livrables);
        } catch (err) {
            console.error("Erreur SQL:", err.message);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
};