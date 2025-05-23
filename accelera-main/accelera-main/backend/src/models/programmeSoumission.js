import pool from '../../db.js'; // Importe le pool de connexion à PostgreSQL

// Classe représentant l'association Programme-Soumission
export class ProgrammeSoumission {
  // Constructeur pour initialiser les propriétés
  constructor(id, programme_id, soumission_id, date_ajout) {
    this.id = id; // ID unique de l'association
    this.programme_id = programme_id; // ID du programme
    this.soumission_id = soumission_id; // ID de la soumission (startup)
    this.date_ajout = date_ajout; // Date d'ajout automatique
  }

  // methode lwala  verifie l'existence d'une soumission
  static async checkSoumissionExists(soumissionId) {
    const { rows } = await pool.query(
      "SELECT id, utilisateur_id, role FROM app_schema.soumissions WHERE id = $1",
      [soumissionId] 
    );
    return rows[0]; }

  // 2 eme  verifie l'existence d'un programme
  static async checkProgrammeExists(programmeId) {
    const { rows } = await pool.query(
      "SELECT id FROM app_schema.programme WHERE id = $1",
      [programmeId]
    );
    return rows[0];
  }

  //3 eme verifie si une soumission est dans un programme
  static async checkSoumissionInProgramme(programmeId, soumissionId) {
    const { rows } = await pool.query(
      "SELECT 1 FROM app_schema.programme_soumissions WHERE programme_id = $1 AND soumission_id = $2",
      [programmeId, soumissionId]
    );
    return rows.length > 0; // Retourne true/false
  }

  // 4 eme Elle insère une nouvelle ligne dans la table app_schema.programme_soumissions qui crée l'association entre une startup (via sa soumission) et un programme.
  static async create(programmeId, soumissionId) {
    const { rows } = await pool.query(
      "INSERT INTO app_schema.programme_soumissions(programme_id, soumission_id, date_ajout) VALUES($1, $2, CURRENT_TIMESTAMP) RETURNING *",
      [programmeId, soumissionId]
    );
    return rows[0]; 
  }
// 5 eme verifie si soumission appartient el hadak el programme
static async checkSubmissionBelongsToProgram(soumissionId, programmeId) {
  const { rows } = await pool.query(
    `SELECT f.programme_id 
     FROM app_schema.soumissions s
     JOIN app_schema.formulaires f ON s.formulaire_id = f.id
     WHERE s.id = $1 AND f.programme_id = $2`,
    [soumissionId, programmeId]
  );
  return rows.length > 0; }

static async getIndividualSubmissions(programmeId) {
  const { rows } = await pool.query(`
     SELECT 
      ps.soumission_id, 
      st.nom_entreprise AS nom 
    FROM app_schema.programme_soumissions ps
    LEFT JOIN app_schema.candidatures_membres cm 
      ON ps.soumission_id = cm.soumission_id
    JOIN app_schema.soumissions s 
      ON ps.soumission_id = s.id
    JOIN app_schema.startups st 
      ON s.utilisateur_id = st.utilisateur_id 
      AND s.role = st.role
    WHERE 
      ps.programme_id = $1 
      AND cm.soumission_id IS NULL`,
    [programmeId]
  );
  return rows;
}
}