import pool from '../../db.js';

export class candidaturePhase {
  constructor(candidature_id, phase_id) {
    this.candidature_id = candidature_id;
    this.phase_id = phase_id;
    this.date_passage = this.date_passage;
  }

  // Vérifier si une candidature est dans une phase spécifique
  static async checkCandidatureInPhase(candidatureId, phaseId) {
    const { rows } = await pool.query(
      `SELECT 1 FROM app_schema.candidatures_phases
       WHERE candidature_id = $1 AND phase_id = $2`,
      [candidatureId, phaseId]
    );
    return rows.length > 0;
  }

  // Ajouter une candidature à une phase
  static async addToPhase(candidatureId, phaseId) {
    const { rows } = await pool.query(
      `INSERT INTO app_schema.candidatures_phases(candidature_id, phase_id, date_passage)
       VALUES($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (candidature_id, phase_id)
       DO UPDATE SET date_passage = CURRENT_TIMESTAMP
       RETURNING *`,
      [candidatureId, phaseId]
    );
    return rows[0];
  }

  // Obtenir la phase actuelle d'une candidature
  static async getCurrentPhase(candidatureId) {
    const { rows } = await pool.query(
      `SELECT cp.phase_id, p.nom, p.description
       FROM app_schema.candidatures_phases cp
       JOIN app_schema.phase p ON cp.phase_id = p.id
       WHERE cp.candidature_id = $1
       ORDER BY cp.date_passage DESC
       LIMIT 1`,
      [candidatureId]
    );
    return rows[0];
  }

  // Obtenir toutes les phases d'une candidature
  static async getAllPhases(candidatureId) {
    const { rows } = await pool.query(
      `SELECT cp.phase_id, p.nom, p.description, cp.date_passage
       FROM app_schema.candidatures_phases cp
       JOIN app_schema.phase p ON cp.phase_id = p.id
       WHERE cp.candidature_id = $1
       ORDER BY cp.date_passage`,
      [candidatureId]
    );
    return rows;
  }

  // Obtenir la première phase d'un programme
  static async getFirstPhase(programmeId) {
    const { rows } = await pool.query(
      `SELECT id, nom, description
       FROM app_schema.phase
       WHERE programme_id = $1
       ORDER BY date_debut ASC
       LIMIT 1`,
      [programmeId]
    );
    return rows[0];
  }

  // Vérifier si une phase est la dernière phase d'un programme
  static async isLastPhase(phaseId) {
    const { rows } = await pool.query(`
      SELECT p1.*
      FROM app_schema.phase p1
      WHERE p1.date_fin = (
        SELECT MAX(p2.date_fin)
        FROM app_schema.phase p2
        WHERE p2.programme_id = p1.programme_id
      )
      AND p1.id = $1
    `, [phaseId]);

    return rows.length > 0;
  }

  // Définir le gagnant d'une phase
  static async setPhaseWinner(phaseId, candidatureId) {
    const { rows } = await pool.query(`
      UPDATE app_schema.phase
      SET gagnant_candidature_id = $1
      WHERE id = $2
      RETURNING *
    `, [candidatureId, phaseId]);

    return rows[0];
  }

  // Obtenir le gagnant d'un programme (gagnant de la dernière phase)
  static async getProgrammeWinner(programmeId) {
    const { rows } = await pool.query(`
      SELECT
        c.id AS candidature_id,
        c.nom_equipe,
        c.type,
        p.nom AS phase_nom
      FROM app_schema.phase p
      JOIN app_schema.candidatures c ON p.gagnant_candidature_id = c.id
      WHERE p.programme_id = $1
      ORDER BY p.date_fin DESC
      LIMIT 1
    `, [programmeId]);

    return rows[0];
  }
}

