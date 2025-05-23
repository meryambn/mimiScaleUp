import pool from '../../db.js';


export class critere{
    constructor(id,nom_critere, type,poids, accessible_mentors,accessible_equipes,rempli_par,necessite_validation,phase_id ){
        this.id= id;
        this.nom_critere=nom_critere;
        this.type=type;
        this.poids = poids;
        this.accessible_mentors=accessible_mentors;
        this.accessible_equipes =accessible_equipes;
       this.rempli_par=rempli_par,
       this.necessite_validation=necessite_validation,
       this.phase_id =phase_id 

    }
    static async create(critereData){
        const {rows}= await pool.query(
            `INSERT INTO app_schema.criteresdevaluation
            (nom_critere, type,poids, accessible_mentors,accessible_equipes,rempli_par,necessite_validation,phase_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
      [
       
        critereData.nom_critere,
        critereData.type,
        critereData.poids,
        critereData.accessible_mentors,
        critereData.accessible_equipes,
        critereData.rempli_par,
        critereData.necessite_validation,
        critereData.phase_id,
      ] 
        ); 
        return rows[0].id;
    }
    static async delete(phaseId){
        const {rowCount}= await pool.query(
            `DELETE FROM app_schema.criteresdevaluation
            WHERE  phase_id=$1`,
            [phaseId]
        );
        return rowCount > 0;}

        static async getallByphaseId(phaseId) {
            const { rows } = await pool.query(
                `SELECT * FROM app_schema.criteresdevaluation
                 WHERE phase_id = $1 `, 
                [phaseId]
            );
            return rows; // Liste des réunions
        }}