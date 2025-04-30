import pool from '../../db.js'; // Chemin relatif depuis le dossier models;

 export class Startup {
  constructor(utilisateur_id, nom_entreprise, site_web, annee_creation, nombre_employes, fichier_entreprise, stage) {
      this.utilisateur_id = utilisateur_id;
      this.role = 'startup'; // Rôle fixé
      this.nom_entreprise = nom_entreprise;
      this.site_web = site_web;
      this.annee_creation = annee_creation;
      this.nombre_employes = nombre_employes;
      this.fichier_entreprise = fichier_entreprise;
      this.stage=stage;
  }
  //methode pour creer une startup fe BDD
  static async create(utilisateurId, infosRole) {
    await pool.query(
      `INSERT INTO app_schema.startups 
      (utilisateur_id, nom_entreprise, site_web, annee_creation, nombre_employes, fichier_entreprise)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        utilisateurId,
        infosRole.nom_entreprise,
        infosRole.site_web,
        infosRole.annee_creation,
        infosRole.nombre_employes,
        infosRole.fichier_entreprise
      ]
    );
  }
//methode pour trouver une startup par son id utilisateur
  static async findByUserId(utilisateurId) {
    const result = await pool.query(
      `SELECT * FROM app_schema.startups 
      WHERE utilisateur_id = $1`,
      [utilisateurId]
    );
    return result.rows[0];//pg retourne toujours un resultat dans un tableau
  }
  //hna be update anmodifiyiw stage passe que de base (par defaut)= Idéation
  static async updateStage(utilisateurId, stage) {
    await pool.query(

      `UPDATE app_schema.startups 
       SET stage = $1 
       WHERE utilisateur_id = $2`,
      [stage, utilisateurId]
    );
  }
 }