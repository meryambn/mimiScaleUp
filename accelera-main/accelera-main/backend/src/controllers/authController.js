// Importe la bibliothèque bcrypt pour hacher et vérifier les mots de passe.
import bcrypt from 'bcrypt';
import { utilisateur } from '../models/utilisateurs.js';
import { Admin } from '../models/admin.js'; // Import the Admin model
import { AdminProfile } from '../models/adminProfile.js'; // Import the AdminProfile model
import { Startup } from '../models/startup.js';
import { Particulier } from '../models/particulier.js';
import { Mentor } from '../models/mentors.js';

// Exporte un objet avec deux méthodes login et register
export const authController = {
  // Méthode pour gérer la connexion
  async login(req, res) {
    try {
      //recuperer l'email et le mot de passe
 const { email, motDePasse } = req.body;
      //verifier si l'email  de l'admin
 const admin = await Admin.findByEmail(email);
      //si mail correct donc admin existe
 if (admin) {

        // comparer le mot de passe donnee avec celui de la BDD
const match = await bcrypt.compare(motDePasse, admin.motdepasse);
        if (match) {
          return res.status(200).json({
            message: 'connexion admin reussie',
            email: admin.email,
            adminId: admin.id
          });
        }
        //si le mot de passe est incorrect

        return res.status(401).json({error:'mot de passse incorrect'})
      }

      // appel asynchrone (await) pour trouver l'uttilisateur s'il exsiste
      const user = await utilisateur.findByEmail(email);
// si existe pas aucun utilisateur n'est trouvé envoie une erreur 401:
      if (!user) return res.status(401).json({ error: 'utilisateur non trouvé' });
      // si existe on compare le mot de passe envoyé avec celuis de la BD
      const match = await bcrypt.compare(motDePasse, user.motdepasse);
  //si mot passe incorrect(false):
      if (!match) return res.status(401).json({ error: 'Mot de passe incorrect' });
//si mot passe correct (true);
      res.status(200).json({
        message: 'Connexion réussie',
        role: user.role,
        utilisateur: { id: user.id, email: user.email, role: user.role }
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },
  // Méthode pour gérer l'inscription
  async register(req, res) {
    try {
      //recuperer les donnees de user
      const { email, motDePasse, telephone, role, infosRole } = req.body;

    if (typeof motDePasse !== 'string') { // Vérifie le type de donnée
        return res.status(400).json({
            error: "Le mot de passe doit être une chaîne de caractères"
        });
    }

    if (motDePasse.length < 6) { // Vérifie la longueur
        return res.status(400).json({
            error: "Le mot de passe doit contenir au moins 6 caractères"
        });
    }
    // Verifie si l'email est deja utiliser
      const existingUser = await utilisateur.findByEmail(email);
      // Si oui renvoie une erreur 400
      if (existingUser) return res.status(400).json({ error: 'utilisateur déjà inscrit' });
// Génère un hash du mot de passe avec un "salt round" de 10
      const hashedmotDePasse = await bcrypt.hash(motDePasse, 10);
      // creer le user
      const utilisateurId = await utilisateur.create(email, hashedmotDePasse, telephone, role);

      // Gestion spécifique au rôle
      switch(role) {
        case 'startup'://creer profil startup
          await Startup.create(utilisateurId, infosRole);
          break;
        case 'mentor'://creer profil mentor
          await Mentor.create(utilisateurId, infosRole);
          break;
        case 'particulier'://creer profil particulier
          await Particulier.create(utilisateurId, infosRole);
          break;
        default://// Si le rôle n'est pas reconnu
          throw new Error('Rôle invalide');
      }


      res.status(201).json({ message: 'Inscription réussie' });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Méthode pour gérer l'inscription des admins
  async registerAdmin(req, res) {
    try {
      // Récupérer les données de l'admin
      const { email, motDePasse, profileData } = req.body;

      // Validation du mot de passe
      if (typeof motDePasse !== 'string') {
        return res.status(400).json({
          error: "Le mot de passe doit être une chaîne de caractères"
        });
      }

      if (motDePasse.length < 6) {
        return res.status(400).json({
          error: "Le mot de passe doit contenir au moins 6 caractères"
        });
      }

      // Vérifier si l'email est déjà utilisé par un admin
      const existingAdmin = await Admin.findByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({ error: 'Admin déjà inscrit avec cet email' });
      }

      // Vérifier si l'email est déjà utilisé par un utilisateur normal
      const existingUser = await utilisateur.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email déjà utilisé' });
      }

      // Générer un hash du mot de passe
      const hashedMotDePasse = await bcrypt.hash(motDePasse, 10);

      // Créer l'admin
      const adminId = await Admin.create(email, hashedMotDePasse);

      // Créer le profil admin si des données de profil sont fournies
      if (profileData) {
        await AdminProfile.create(adminId, profileData);
      }

      res.status(201).json({
        message: 'Inscription admin réussie',
        adminId: adminId
      });

    } catch (err) {
      console.error('Erreur lors de l\'inscription admin:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

//methode pour update el mot passe
async updatePassword(req, res) {
  try {
    const {email, oldPassword, newPassword } = req.body;
     // Log des données reçues
     console.log("Données reçues :", { email,oldPassword, newPassword });

    // on verifie d'abord si l'user existe ou non dans la BDD
    const user = await utilisateur.findByEmail(email);

    console.log("Utilisateur trouvé :", user); // Vérifiez si l'utilisateur existe
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    // Vérifiez que user.motdepasse existe
    console.log("Hash stocké :", user.motdepasse);
    // on compare l'ancien mot de passe avec celui stocké dans bdd
    const match = await bcrypt.compare(oldPassword, user.motdepasse);
    if (!match) return res.status(401).json({ error: 'Ancien mot de passe incorrect' });

    // verification pour le nouveau mot de passe
    if (typeof newPassword !== 'string' ) {
      return res.status(400).json({
        error: 'Le nouveau mot de passe doit etre une chaine de caractere'
      });
    }
if (newPassword.length < 6){
  return res.status(400).json({
    error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
  })
}
    //on crypte le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await utilisateur.updatePassword(user.id, hashedPassword);

    res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
};