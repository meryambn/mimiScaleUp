import pool from '../../db.js';
   
//classe representant le modele de donnees reunion 
export class reunion{
    constructor(id,nom_reunion, date,heure, lieu,phase_id){
        this.id= id;
        this.nom_reunion=nom_reunion;
        this.date=date;
        this.heure = heure;
        this.lieu= lieu;
        this.phase_id =phase_id;
       
    }
    //1 methode pour creer une reunion en BDD
static async create(reunion){
    const {rows}= await pool.query(
        `INSERT INTO app_schema.reunion
        (nom_reunion, date, heure,lieu,phase_id)
        VALUES ($1, $2, $3, $4,$5)
         RETURNING id`,
         [
          reunion.nom_reunion,
          reunion.date,
          reunion.heure,
           reunion.lieu,
           reunion.phase_id,
        
        ]
    );
    return rows[0].id;

}
//2 eme ethode pour recuperer toutes les reunions d'une phase
static async getallByphaseId(phaseId) {
    const { rows } = await pool.query(
        `SELECT * FROM app_schema.reunion 
         WHERE phase_id = $1 
         ORDER BY date, heure`, // les afficher par tri de date et heure
        [phaseId]
    );
    return rows; // Liste des réunions
}
//3eme methode pour supprimer une reunion
static async delete(reunionId,phaseId){
    const {rowCount}= await pool.query(
        `DELETE FROM app_schema.reunion 
        WHERE id=$1 AND phase_id=$2`,
        [reunionId,phaseId]
    );
    return rowCount > 0;
}}