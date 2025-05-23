import { utilisateur } from '../models/utilisateurs.js';
import { Particulier } from '../models/particulier.js';
    
export const profileControllerParticulier ={
    //methode pour afficher le profil d'un particulier
    async profileparticulier(req,res){
        try{
            //recuperer id de la requete 
            const userId = req.params.userId;
            console.log("Id recu ",userId);//pour verifier dans le cmd si l'id est envoyer
            //verifier si l'utilisateur existe
            const user = await utilisateur.findById(userId);
            console.log("utilisateur existe",user);
            if (!user) return res.status(404).json({error: 'utilisateur non trouvé'});

            //verifier si le particulier existe car il peut etre une startup ou un mentor malgre que cest un utilisateur
            const part = await Particulier.findByUserId(userId);

            console.log("Particulier existe",part);//pour verifier dans le cmd 
            
            if (!part) return res.status(404).json({error : 'Particulier non trouvé'});
        // si particulier existe son id
     //objet data qui contient les info (nom,prenom,email,tel) du particulier: bach haka yaffichihom
            const data = { 
                nom: part.nom,
                prenom : part.prenom,
                email : user.email,
                telephone: user.telephone,
            }
            // retourne l'objet data (les info du particulier dans le profil)
            res.status(200).json(data);
        }catch(err){
            res.status(400).json({error:'Erreur serveur'});
            ////si ya une erreur elle laffiche dans le cmd pour maider á localiser le probleme HELP 
            console.error("Erreur détaillée :", err); 
        }
    }
}