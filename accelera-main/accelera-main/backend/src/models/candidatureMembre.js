import pool from '../../db.js'; // Chemin relatif depuis le dossier models;

 export class CandidatureMembre{
  constructor(candidatures_id, soumission_id){
      this.candidatures_id = candidatures_id; // Rôle fixé
      this.soumission_id = soumission_id;
    }

 static async lierSoumission(candidatureId, soumissionId) {
  await pool.query(
    "INSERT INTO app_schema.candidatures_membres(candidatures_id, soumission_id) VALUES ($1, $2)",
    [candidatureId, soumissionId]
  );
}
static async getByCandidature(candidatureId) {
    const { rows } = await pool.query(
      "SELECT soumission_id FROM app_schema.candidatures_membres WHERE candidatures_id = $1",
      [candidatureId]
    );
    return rows.map(row => row.soumission_id); // Retourne un tableau d'IDs
  }
  }