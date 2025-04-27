import { equipe } from '../models/equipe.js';
import { utilisateur } from '../models/utilisateurs.js';
import { Startup } from '../models/startup.js';


export const profileController = {
async profilstartup(req, res) {
	try{
        const userId = req.params.userId;
        console.log("ID reçu :", userId);
        const user = await utilisateur.findById(userId);
        console.log("Utilisateur trouvé :", user);
        if(!user) return res.status(404).json({error: 'Utilisateur non trouve'});
          const startup = await Startup.findByUserId(userId);
          if (!startup) return res.status(404).json({ error: 'Profil startup non trouvé' });

          const Equipe = await equipe.findByStartupId(userId);
        // Construit la reponse data
            const data = {
                nom_entreprise: startup.nom_entreprise,
                email: user.email,
                telephone: user.telephone,
                site_web: startup.site_web,
                annee_creation: startup.annee_creation,
                nombre_employes: startup.nombre_employes,
                fichier_entreprise: startup.fichier_entreprise,
                date_creation: user.date_creation,
                equipe:Equipe,
                stage:startup.stage
               };
              res.status(200).json(data);

    }catch(err){
        res.status(500).json({ error: 'Erreur serveur' });
    }
},


//hna cest la methode pour ajouter un membre dans l'equipe d'une startup
 async addEquipe(req,res){
  try{

    const userId= req.params.userId;
    console.log("id recu :",userId);

    const {matricule, nom, prenom}=req.body;
    //creer lequipe en appelant la methode create
const Equipe = await equipe.create(matricule,nom,prenom,userId);
console.log("equipe ajouter", Equipe);
if (Equipe) {
  res.status(201).json({message:'Membre ajouté avec succès'})
}}catch (err){
  res.status(500).json({error: 'Erreur serveur'})
  //si ya une erreur elle laffiche dans le cmd pour maider á localiser le probleme
  console.log("Erreur SQL:", err.message);
}
  },


//hna cest la methode pour ajputer un stage (fih 5 type )
  async addstage(req,res){
    try{
      //recup id de la requete http
      const userId= req.params.userId;
      console.log("id recu :",userId);
      //recup le stage du body
     const {stage}=req.body;
     const allowedStages = ['Idéation', 'Pré-MVP', 'MVP', 'Growth', 'Scaling'];
     if (!allowedStages.includes(stage)) {
       return res.status(400).json({ error: "Stage invalide" });
     }
     const p= await Startup.updateStage(userId,stage)
     console.log("le stage",p);
      res.status(201).json({message:' stage ajouté avec succès'})
    }catch (err){
      res.status(500).json({error: 'Erreur serveur'})
      console.log("Erreur SQL:", err.message);
    }
  }
 }
