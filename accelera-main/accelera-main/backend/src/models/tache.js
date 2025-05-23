import pool from '../../db.js';
   

export class tache{
    constructor(id,nom,description, date_decheance, phase_id){
        this.id= id;
        this.nom=nom;
        this.description=description;
        this.date_decheance = date_decheance;
        this.phase_id = phase_id;
       
    }
    static async create(tache) {
       
        const { rows }=  await pool.query(
            `INSERT INTO app_schema.tache
            (nom, description, date_decheance,phase_id)
            VALUES ($1, $2, $3, $4)
             RETURNING id`,
             [
              tache.nom,
              tache.description,
              tache.date_decheance,
               tache.phase_id
            
            ]
          );
}
//cette methode permet de supprimer une tache d'une phase
static async delete(phaseId) {
    const { rowCount } = await pool.query(
      `DELETE FROM app_schema.tache WHERE  phase_id=$1`,
      [phaseId]
    );
    //  rowCount Indique combien de lignes ont été supprimées ou mis a jour
    return rowCount > 0;
  }
  //cette methode permer d'afficher les taches d'une phase
  //elle prend id comme parametre l'id de la phase 
  static async getAllByPhaseId(phaseId) {
    const { rows } = await pool.query(
      `SELECT * FROM app_schema.tache 
       WHERE phase_id = $1 
       ORDER BY date_decheance`,
      [phaseId]
    );
    return rows;
  }
  }