import { Programme } from '../models/programme.js';
import pool from '../../db.js';

export const programmeController = {
  //1 methode creer un programme 
  async createProgramme(req, res) {
    try {
      //recuperation des donnees du corps de la requete
      const { 
        type,
        nom,
        description,
        date_debut,
        date_fin,
        phases_requises,
        industries_requises,
        documents_requis,
        taille_equipe_min,
        taille_equipe_max,
        ca_min,
        ca_max,
        admin_id=1
      } = req.body;
      //verifie si datedebut et date de fin sont valides
if (date_debut > date_fin){
  return res.status(400).json({error:'date de dabut doit etre inf a date de fin'})
}
      // verifier si le type de programme est valide
      const validTypes = ['Accélération', 'Incubation', 'Hackathon', 'Défi d\'innovation', 'Personnalisé'];
      
      // si le type de programme nest pas valide (il appartient pas el les types li jai declarer)
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Type de programme invalide' });
      }

      // Création du programme
      const newProgramme = new Programme(
        null, // id généré automatiquement
        type,
        nom,
        description,
        date_debut,
        date_fin,
        phases_requises || [],
        industries_requises || [],
        documents_requis || [],
        taille_equipe_min || 1,
        taille_equipe_max || 8,
        ca_min || 0,
        ca_max || 500000
      );
//insertion dans la BDD avec appel de la methode create de programme
const programmeId = await Programme.create(newProgramme);

//si programme creer envoyer son id
      res.status(201).json({ 
        id: programmeId,
        message: 'Programme créé avec succès',
        
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },



  // 2 methode recuperer les infos d'un programme avec ses mentors associés
  async getProgrammeDetails(req, res) { // <-- Nom exact ici
    try {
      
      const programmeId = req.params.id;
      const programme = await Programme.getProgrammeWithMentors(programmeId);
      //si programme nexiste pas 
      if (!programme) {
        return res.status(404).json({ error: 'Programme non trouvé' });
      }
      //si existe
      res.json(programme);
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la récupération du programme',
        details: error.message 
      });
    }
  }, 


  
  // 3 eme methode Ajout d'un mentor à un programme
  async addmetor(req,res){
    
        try {
  const { mentorId } = req.body;
 const programmeId = req.params.id;
    //verifie si le corps de la requete contient lid du mentor et lid du programme dans la requete
  if (!mentorId ) {
        return res.status(400).json({ error: "ID manquant  mentor" });
            }
  if ( !programmeId) {
     return res.status(400).json({ error: "ID manquant programme" });
            }
    
  // Vérifiez d'abord si le mentor et le programme existent dans la BDD
const mentorExists = await pool.query(
  'SELECT 1 FROM app_schema.mentors WHERE utilisateur_id = $1', 
        [mentorId]
            );
            
  const programmeExists = await pool.query(
   'SELECT 1 FROM app_schema.programme WHERE id = $1', 
                [programmeId]
            );

    //si l'un des deux nexiste pas dans la BDD
 if (!mentorExists.rows.length || !programmeExists.rows.length) {
   return res.status(404).json({ error: "Mentor ou programme non trouvé" });
            }
    
            //ajout du mentor au programme
 await Programme.addMentorToProgramme(programmeId, mentorId);

     res.status(200).json({ message: 'Mentor ajouté avec succès' });
        } catch (error) {
            console.error("Erreur détaillée:", error);
            res.status(500).json({ 
                error: "Échec de l'ajout du mentor",
                details: error.message 
            });
        }
    },
    
//4 eme methode delete le mentor d'un programme
    async delmentor(req,res){
      try{
        const{programmeId,mentorId}=req.params;
        if (!mentorId ) {
          return res.status(400).json({ error: "ID manquant  mentor" });
              }
    if ( !programmeId) {
       return res.status(400).json({ error: "ID manquant programme" });
              }
               await Programme.deletementor(programmeId,mentorId)
               res.status(200).json({message: 'mentor retirer avec succes'});
               
      }catch(err){
        res.status(500).json({ error:'erreur serveur'})
      }
    },




    // 4 eme methode modifier un programme
    async updateProgramme(req,res){
      try{
const {programmeId}=req.params;
console.log("id",programmeId)
const updatedData=req.body;

  //on verifie si le programme exista
  const exist = await Programme.findById(programmeId);
  if(!exist){
    return res.status(404).json({error:'programme nexiste pas'});
  }
 // date_debut = new Date(date_debut + 'T00:00:00Z');
//date_fin = new Date(date_fin + 'T23:59:59Z');
  const updatedProgramme = await Programme.updateProgramme(programmeId,updatedData);
  
  res.status(200).json({
      success: true,
      data: updatedProgramme
  });

      }catch(err){
        res.status(500).json({error:'erreur serveur'});
        console.log("Erreur SQL:", err.message);
      }


    }
   }