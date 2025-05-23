import pool from '../../db.js';

export class Reponse{
    constructor(id, soumission_id, question_id, valeur) {
        this.id = id;
        this.soumission_id = soumission_id;
        this.question_id = question_id;
        this.valeur = valeur ;
        }
 static async create(response) {
     const { rows } = await pool.query(
     'INSERT INTO app_schema.reponses (soumission_id, question_id, valeur) VALUES ($1, $2, $3) RETURNING *',
      [response.soumission_id, response.question_id, response.valeur]
        );
    return rows[0];
    }
    static async findBySoumission(soumission_id) {
        const { rows } = await pool.query(
          'SELECT * FROM app_schema.reponses WHERE soumission_id = $1',
          [soumission_id]
        );
}
// Récupère toutes les réponses d'une soumission avec les détails des questions
static async findBySoumissionWithQuestions(soumission_id) {
  const { rows } = await pool.query(`
      SELECT 
          r.*,
          q.texte_question,
          q.description AS question_description,
          q.type AS question_type,
          q.obligatoire AS question_obligatoire,
          q.evaluation_min,
          q.evaluation_max
      FROM app_schema.reponses r
      JOIN app_schema.questions q ON q.id = r.question_id
      WHERE r.soumission_id = $1
  `, [soumission_id]);
  return rows;
}}