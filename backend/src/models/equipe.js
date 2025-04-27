import pool from '../../db.js';
export class equipe {
    constructor( matricule, nom, prenom, startup_id) {
        this. matricule = matricule;
        this.nom = nom; // Rôle fixé
        this.prenom = prenom;
        this. startup_id=  startup_id;

    }
    //creer equipe
static async create(matricule, nom, prenom, startup_id){
    const result = await pool.query(
        'INSERT INTO app_schema.equipe ( matricule, nom, prenom, startup_id) VALUES ($1,$2,$3,$4) RETURNING *',
        [matricule, nom, prenom, startup_id]
    );
    return result.rows[0]; // Return the inserted row
}
//had la methode permet de récupérer tous les membres d'équipe associés à une startup spécifique via son startup_id li aykon = utilisateur_id
static async findByStartupId(startup_id) {
    const result = await pool.query(
      `SELECT * FROM app_schema.equipe WHERE startup_id = $1`,
      [startup_id]
    );
    return result.rows;
  }


}