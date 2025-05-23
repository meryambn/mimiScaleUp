import pool from '../../db.js';

export class Formulaire {
    constructor(id, titre,  url_formulaire ,description,  message_confirmation,programme_id) {
        this.id = id;
        this.titre = titre;
        this.url_formulaire  =  url_formulaire ;
        this.description = description;
        this. message_confirmation =  message_confirmation;
        this.programme_id =programme_id;
    }
    //1 ere methode creation dun form
    static async create(formData) {
        const { rows } = await pool.query(
            `INSERT INTO app_schema.formulaires 
            (titre, url_formulaire, description, message_confirmation, programme_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                formData.titre,
                formData.url_formulaire,
                formData.description,
                formData.message_confirmation,
                formData.programme_id
            ]
        );
        return rows[0];
    }
    //2 eme methode recuperer un form unique pour un programme
    static async getByProgId(programmeId) {
        const { rows } = await pool.query(
          `SELECT * FROM app_schema.formulaires 
          WHERE programme_id = $1`,
          [programmeId]
        );
        return rows[0]; // Retourne le formulaire unique ou undefined
      }
// 3eme methode delete 
      static async delete(programmeId){
        const {rowCount}= await pool.query(
            `DELETE FROM app_schema.formulaires
            WHERE programme_id=$1`,
            [programmeId]
        );
        return rowCount > 0;
    }
    
}