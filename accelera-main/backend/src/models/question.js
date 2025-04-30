import pool from '../../db.js';

export class question{
    constructor(id, texte_question, description, type, obligatoire,programmeid) {
        this.id = id;
        this.texte_question = texte_question;
        this.description = description;
        this.type = type;
        this.obligatoire = obligatoire;
        this.programmeid =programmeid;}
    
        static async create(questionData) {
            const { rows } = await pool.query(
                `INSERT INTO app_schema.questions 
                (texte_question, description, type, obligatoire,programmeid)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [
                    questionData.texte_question,
                    questionData.description,
                    questionData.type,
                    questionData.obligatoire,
                    questionData.programmeid
                ]
            );
            return rows[0];   
    }

    static async delete(questionId,programmeId){
        const {rowCount}= await pool.query(
            `DELETE FROM app_schema.questions
            WHERE id=$1 AND programmeid=$2`,
            [questionId,programmeId]
        );
        return rowCount > 0;
    }
    static async update(questionId, programmeId, updateData) {
        const { rows } = await pool.query(
            `UPDATE app_schema.questions 
            SET texte_question = $1,
                description = $2,
                type = $3,
                obligatoire = $4
            WHERE id = $5 AND programmeid = $6
            RETURNING *`,
            [
                updateData.texte_question,
                updateData.description,
                updateData.type,
                updateData.obligatoire,
                questionId,
                programmeId
            ]
        );
        return rows[0];
    }

    static async getallByprogId(programmeid) {
        const { rows } = await pool.query(
            `SELECT * FROM app_schema.questions
             WHERE programmeid = $1 
             `, // les afficher par tri de date et heure
            [programmeid]
        );
        return rows; // Liste des réunions
    }
}