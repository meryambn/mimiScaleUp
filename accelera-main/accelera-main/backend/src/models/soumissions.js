import pool from '../../db.js';


//classe soumission
export class Soumission{
    constructor(id, formulaire_id, utilisateur_id, role) {
        this.id = id;
        this.formulaire_id = formulaire_id;
        this.utilisateur_id = utilisateur_id;
        this.role = role;
        }
    //1 ere methode creation dune soumission
        static async create(submission) {
            const { rows } = await pool.query(
                `INSERT INTO app_schema.soumissions
                (formulaire_id, utilisateur_id, role, created_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                RETURNING *`,
                [submission.formulaire_id,
                 submission.utilisateur_id,
                    submission.role]
        );
        return rows[0];
    }
    // 2 eme methode  recuperation dune soumission
    static async getByIdWithDetails(id) {
        const { rows } = await pool.query(`
            SELECT
                s.*,
                u.email,
                u.role,
                CASE
                    WHEN s.role = 'startup' THEN
                        (SELECT nom_entreprise FROM app_schema.startups WHERE utilisateur_id = s.utilisateur_id)
                    WHEN s.role = 'particulier' THEN
                        (SELECT nom FROM app_schema.particuliers WHERE utilisateur_id = s.utilisateur_id)
                    ELSE 'Utilisateur'
                END AS utilisateur_nom,
                CASE
                    WHEN s.role = 'particulier' THEN
                        (SELECT prenom FROM app_schema.particuliers WHERE utilisateur_id = s.utilisateur_id)
                    WHEN s.role = 'mentor' THEN
                        (SELECT prenom FROM app_schema.mentors WHERE utilisateur_id = s.utilisateur_id)
                    ELSE ''
                END AS utilisateur_prenom,
                f.titre AS formulaire_titre,
                f.description AS formulaire_description
            FROM app_schema.soumissions s
            JOIN app_schema.utilisateur u ON u.id = s.utilisateur_id
            JOIN app_schema.formulaires f ON f.id = s.formulaire_id
            WHERE s.id = $1
        `, [id]);
        return rows[0];
    }

    // 3eme methode pour récupérer toutes les soumissions pour un programme
    static async getByProgrammeId(programme_id) {
        const { rows } = await pool.query(`
            SELECT
                s.id,
                s.formulaire_id,
                s.utilisateur_id,
                s.role,
                s.created_at,
                u.email,
                CASE
                    WHEN s.role = 'startup' THEN
                        (SELECT nom_entreprise FROM app_schema.startups WHERE utilisateur_id = s.utilisateur_id)
                    WHEN s.role = 'particulier' THEN
                        (SELECT nom FROM app_schema.particuliers WHERE utilisateur_id = s.utilisateur_id)
                    ELSE 'Utilisateur'
                END AS utilisateur_nom,
                CASE
                    WHEN s.role = 'particulier' THEN
                        (SELECT prenom FROM app_schema.particuliers WHERE utilisateur_id = s.utilisateur_id)
                    WHEN s.role = 'mentor' THEN
                        (SELECT prenom FROM app_schema.mentors WHERE utilisateur_id = s.utilisateur_id)
                    ELSE ''
                END AS utilisateur_prenom,
                f.titre AS formulaire_titre,
                f.programme_id
            FROM app_schema.soumissions s
            JOIN app_schema.utilisateur u ON u.id = s.utilisateur_id
            JOIN app_schema.formulaires f ON f.id = s.formulaire_id
            WHERE f.programme_id = $1
            ORDER BY s.id DESC
        `, [programme_id]);
        return rows;
    }

    // 4eme methode pour verifier si un utilisateur a deja soumis un formulaire
    static async hasUserSubmitted(formulaire_id, utilisateur_id) {
        const { rows } = await pool.query(`
            SELECT COUNT(*) as count
            FROM app_schema.soumissions
            WHERE formulaire_id = $1 AND utilisateur_id = $2
        `, [formulaire_id, utilisateur_id]);
        return parseInt(rows[0].count) > 0;
    }
}