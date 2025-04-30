import pool from '../../db.js';
   
//classe representant le modele de donnees liverable 
export class liverable{
    constructor(id,nom, description, date_echeance, types_fichiers,phase_id){
        this.id= id;
        this.nom=nom;
        this.description=description;
        this. date_echeance =date_echeance;
        this.types_fichiers=types_fichiers;
        this.phase_id =phase_id;
       
    }
    //creer un nvx liv dans BDD
   static async create(liverable){
    const {rows}= await pool.query(
        `INSERT INTO app_schema.livrables
        (nom,  description,  date_echeance, types_fichiers,phase_id)
        VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
         [
          liverable.nom,
          liverable.description,
          liverable.date_echeance,
          liverable.types_fichiers,
           liverable.phase_id,
        
        ]
    );
    return rows[0].id;


   }
   //supprime un liv dune BDD
   static async delete(liverableId,phaseId){
    const {rowCount}= await pool.query(
        `DELETE FROM app_schema.livrables
        WHERE id=$1 AND phase_id=$2`,
        [liverableId,phaseId]
    );
    return rowCount > 0;
}
//Récupère tous les livrables d'une phase spécifique
static async getallByphaseId(phaseId) {
    const { rows } = await pool.query(
        `SELECT * FROM app_schema.livrables
         WHERE phase_id = $1 `, 
        [phaseId]
    );
    return rows; 
}

}