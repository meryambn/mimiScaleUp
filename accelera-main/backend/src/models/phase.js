import pool from '../../db.js'; 

export class phase{
    constructor(id,nom,description,date_debut,date_fin,gagnant,programme_id){
        this.id=id;
        this.nom=nom;
        this.description=description;
        this.date_debut=date_debut;
        this.date_fin=date_fin;
        this.gagnant=gagnant || false;
        this.programme_id=programme_id;


    }
   static async create(phase){
    const{rows}=await pool.query(
        `INSERT INTO app_schema.phase
        (nom,description,date_debut,date_fin,gagnant,programme_id)
        VALUES($1,$2,$3,$4,$5,$6) 
         RETURNING id`,
        [phase.nom,phase.description,phase.date_debut,phase.date_fin,phase.gagnant,phase.programme_id]

    );
    return rows[0].id;
   }
   // Récupère toutes les phases d'un programme triées par date_debut
   static async getByProgramme(programmeId) {
   
    const { rows } = await pool.query(
      `SELECT * FROM app_schema.phase 
       WHERE programme_id = $1 
       ORDER BY date_debut`, // Tri chronologique
      [programmeId]
    );
    return rows; // Retourne les résultats SQL
  };
//pour supprimer une phase
static async delete(programmeId, phaseId) {
  const { rows } = await pool.query(
    `DELETE FROM app_schema.phase WHERE programme_id=$1 AND id=$2`,
    [programmeId, phaseId]
  );
  return rows;
}


}