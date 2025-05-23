import pool from '../../db.js';
export class  Note {
    constructor(candidatureId, critereId, prenom, profession) {
        this.candidatureId = candidatureId;
        this.critereId = critereId; 
        this.valeur = valeur;  
    }
    //methode lwla  creation une reponse Ã  un critere
static async create(candidature_id, critere_id, valeur, rempli_par_mentor_id) {
  const { rows } = await pool.query(
    `INSERT INTO app_schema.note (
      candidature_id, critere_id, valeur, rempli_par_mentor_id
    ) VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [candidature_id, critere_id, valeur, rempli_par_mentor_id]
  );
  return rows[0];
}
    // 2eme methode pour verifier si une reponse existe deja
    static async hasResponse(candidatureId, critereId) {
        const { rows } = await pool.query(
            `SELECT id FROM app_schema.note 
             WHERE candidature_id = $1 AND critere_id = $2`,
            [candidatureId, critereId]
        );
        return rows.length > 0;
    }

     static async exists(candidatureId, critereId) {
        const { rows } = await pool.query(
            `SELECT id FROM app_schema.note 
             WHERE candidature_id = $1 AND critere_id = $2`,
            [candidatureId, critereId]
        );
        return rows.length > 0;
    }
    // Dans la classe Note
static async getReponsesByCandidatureAndPhase(candidatureId, phaseId) {
    const { rows } = await pool.query(`
        SELECT 
            c.id AS critere_id,
            c.nom_critere,
            c.type,
            c.rempli_par,
            n.valeur AS reponse
        FROM app_schema.criteresdevaluation c
        LEFT JOIN app_schema.note n 
            ON c.id = n.critere_id 
            AND n.candidature_id = $1
        WHERE 
            c.phase_id = $2
            AND c.rempli_par = 'equipes'  
        ORDER BY c.id
    `, [candidatureId, phaseId]);
    
    return rows;
}

}