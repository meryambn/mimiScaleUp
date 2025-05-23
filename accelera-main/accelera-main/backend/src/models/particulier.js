import pool from '../../db.js'; // Chemin relatif depuis le dossier models

export class Particulier {
    constructor(utilisateur_id, nom, prenom) {
        this.utilisateur_id = utilisateur_id;
        this.role = 'particulier'; // Rôle fixé
        this.nom = nom;
        this.prenom = prenom;
    }
    static async create(utilisateurId, infosRole) {
        await pool.query(
          `INSERT INTO app_schema.particuliers 
          (utilisateur_id, nom, prenom)
          VALUES ($1, $2, $3)`,
          [
            utilisateurId,
            infosRole.nom,
            infosRole.prenom
          ]
        );
      }
      // methode pour recuperer un particulier avec son id d'utilisateur
      static async findByUserId(utilisateur_id){
        const result = await pool.query(
          'SELECT * FROM app_schema.particuliers WHERE utilisateur_id =$1',
          [utilisateur_id]
        )
        return result.rows[0];
      }
}