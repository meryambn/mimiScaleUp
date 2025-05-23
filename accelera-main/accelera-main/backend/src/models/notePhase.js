import pool from '../../db.js';
import { phase } from './phase.js';

export class NotePhase {
    constructor(phase_id, candidature_id, mentor_id, note) {
        this.phase_id=phase_id;
        this.candidature_Id = candidature_Id;
        this.mentor_id = mentor_id; 
        this.note = note;  
    }
    // CrÃ©ation d'une note
    static async create(phase_id, candidature_id, mentor_id, note) {
        const { rows } = await pool.query(
            `INSERT INTO app_schema.note_phase 
            (phase_id, candidature_id, mentor_id, note)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [phase_id, candidature_id, mentor_id, note]
        );
        return rows[0];
    }
static async getByPhaseAndCandidature(phase_id, candidature_id) {
    const { rows } = await pool.query(
       `SELECT np.*, 
        m.nom as mentor_nom, 
        m.prenom as mentor_prenom 
        FROM app_schema.note_phase np
        JOIN app_schema.mentors m ON np.mentor_id = m.utilisateur_id
        WHERE np.phase_id = $1 
        AND np.candidature_id = $2`,
        [phase_id, candidature_id]
    );
    return rows[0] || null;
}
    
    static async existsForPhaseAndCandidature(phase_id, candidature_id) {
    const { rows } = await pool.query(
        `SELECT id FROM app_schema.note_phase 
        WHERE phase_id = $1 
        AND candidature_id = $2`,
        [phase_id, candidature_id]
    );
    return rows.length > 0;
}
}