import pool from '../../db.js'; // Chemin relatif depuis le dossier models;

 export class Candidature{
  constructor( nom_equipe, description_equipe, programme_id){
      this.nom_equipe = nom_equipe; // Rôle fixé
      this.description_equipe = description_equipe;
      this.programme_id = programme_id;}


       
 static async create(nom, description, programmeId) {
  const { rows } = await pool.query(
    "INSERT INTO app_schema.candidatures(nom_equipe, description_equipe, programme_id) VALUES ($1, $2, $3) RETURNING *",
    [nom, description, programmeId]
  );
  return rows[0];
}
static async getByProgramme(programmeId) {
  const { rows } = await pool.query(
    `SELECT * FROM app_schema.candidatures
     WHERE programme_id = $1`,
    [programmeId]
  );
  return rows;
}
  }