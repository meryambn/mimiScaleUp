class Utilisateur {
    constructor(id, email, motDePasse, telephone, role, date_creation) {
        this.id = id;
        this.email = email;
        this.motDePasse = motDePasse;
        this.telephone = telephone;
        this.role = role;
        this.date_creation = date_creation || new Date().toISOString();
    }
  }
  class Particulier {
    constructor(utilisateur_id, nom, prenom) {
        this.utilisateur_id = utilisateur_id;
        this.role = 'particulier'; // Rôle fixé
        this.nom = nom;
        this.prenom = prenom;
    }
}
class Mentor {
    constructor(utilisateur_id, nom, prenom, profession) {
        this.utilisateur_id = utilisateur_id;
        this.role = 'mentor'; // Rôle fixé
        this.nom = nom;
        this.prenom = prenom;
        this.profession = profession;
    }
}
class Startup {
    constructor(utilisateur_id, nom_entreprise, site_web, annee_creation, nombre_employes, fichier_entreprise) {
        this.utilisateur_id = utilisateur_id;
        this.role = 'startup'; // Rôle fixé
        this.nom_entreprise = nom_entreprise;
        this.site_web = site_web;
        this.annee_creation = annee_creation;
        this.nombre_employes = nombre_employes;
        this.fichier_entreprise = fichier_entreprise;
    }
  }