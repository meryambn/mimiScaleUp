
import{phase}from '../models/phase.js';
import{Programme}from'../models/programme.js';

export const phaseController={
  // methode 1 permet d'ajouter ou creer une phase dans un programme
    async addphase(req,res){
       try{ const{nom,description,date_debut,date_fin,gagnant}=req.body;
       const { programmeId } = req.params; 
console.log("id programme recu:",programmeId);
        if (new Date(date_debut) >= new Date(date_fin)) {
            return res.status(400).json({ error: "Dates invalides" });
        }

        
        await phase.create({ 
            nom, 
            description, 
            date_debut, 
            date_fin, 
            programme_id: programmeId, // <-- Nom de colonne SQL
            gagnant: gagnant || false
        });
        res.status(201).json({message: "Phase ajouté"});
    }catch(err){
      res.status(500).json({error: 'Erreur serveur'})
        console.log("Erreur SQL:", err.message);
    }},
//methode 2 recuperer les phases d'un programme (les afficher)
    async getPhases(req, res) {
        try {
          const { programmeId } = req.params; // Récupère l'ID depuis l'URL
          const phases = await phase.getByProgramme(programmeId); // Appel au modèle
          res.json(phases); // Renvoie les données en JSON
        } catch (err) {
          res.status(500).json({ error: 'Erreur serveur' }); // Gestion d'erreur
        }
      },
      //permet de supprimer une phase d'un programme
      async deletephase(req,res){
        try{
            const {programmeId,phaseId}=req.params;
        await phase.delete(programmeId,phaseId);
    res.status(200).json({message:"phase supprimée"});
}catch(err){
    res.status(500).json({error:'Erreur serveur'});
}
        },
      
      }

