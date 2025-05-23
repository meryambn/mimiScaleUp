import pool from '../../db.js';


//class de question 
export class question{
    
    constructor(id, texte_question, description, type, obligatoire,programmeid, evaluation_min, evaluation_max) {
        this.id = id;
        this.texte_question = texte_question;
        this.description = description;
        this.type = type;
        this.obligatoire = obligatoire;
        this.programmeid =programmeid;
        this.evaluation_min = evaluation_min;
        this.evaluation_max = evaluation_max;}
    //1 ere methode pour creer une question dans la base BDD
        static async create(questionData) {
            const { rows } = await pool.query(
                `INSERT INTO app_schema.questions 
                (texte_question, description, type, obligatoire,programmeid,evaluation_min, evaluation_max)
                VALUES ($1, $2, $3, $4, $5,$6, $7)
                RETURNING *`,
                [
                    questionData.texte_question,
                    questionData.description,
                    questionData.type,
                    questionData.obligatoire,
                    questionData.programmeid,
                    questionData.evaluation_min || null,
            questionData.evaluation_max || null
                ]
            );
// Si le type est une liste déroulante wela checkboxes wela radiobuttons, ajouter les options
if (
  ['RadioButtons', 'Checkboxes', 'liste_deroulante'].includes(questionData.type) 
            && questionData.options?.length > 0
        ) {
            for (const [index, option] of questionData.options.entries()) {
                await pool.query(
                    `INSERT INTO app_schema.question_options 
                    (question_id, option_text, ordre)
                    VALUES ($1, $2, $3)`,
                    [rows[0].id, option.text, index + 1]
                );
            }
        }
        return rows[0];
    }
// 2 eme methode pour supprimer une qst
    static async delete(questionId,programmeId){
        const {rowCount}= await pool.query(
            `DELETE FROM app_schema.questions
            WHERE id=$1 AND programmeid=$2`,
            [questionId,programmeId]
        );
        return rowCount > 0;
    }
    // 3 eme methode modifier une qst la mettre á jour 
    static async update(questionId, programmeId, updateData) {
        const { rows } = await pool.query(
            `UPDATE app_schema.questions 
            SET texte_question = $1,
                description = $2,
                type = $3,
                obligatoire = $4,
                 evaluation_min = $7,  // Ajouté
            evaluation_max = $8    // Ajouté
            WHERE id = $5 AND programmeid = $6
            RETURNING *`,
            [
                updateData.texte_question,
                updateData.description,
                updateData.type,
                updateData.obligatoire,
                questionId,
                programmeId,
                updateData.evaluation_min || null, // Ajouté
                updateData.evaluation_max || null  // Ajouté
            ]
        );
        return rows[0];
    }

   // 4 eme methode recuperer toutes les qsts dun programme
  static async getallByprogId(programmeid) {
    const { rows } = await pool.query(
        `SELECT 
            q.*, 
            COALESCE(
                json_agg(
                    o.option_text ORDER BY o.ordre
                ) FILTER (WHERE o.id IS NOT NULL), 
                '[]'
            ) as options
        FROM app_schema.questions q
        LEFT JOIN app_schema.question_options o ON q.id = o.question_id
        WHERE q.programmeid = $1
        GROUP BY q.id
        ORDER BY q.id`, // Remplacez par une colonne de tri (ex: created_at)
        [programmeid]
    );
    return rows;
}
//5 eme supprimer toutes les qsts dun programme
static async deletetouteqst(programmeId){
    const {rowCount}= await pool.query(
        `DELETE FROM app_schema.questions
        WHERE  programmeid=$1`,
        [programmeId]
    );
    return rowCount > 0;
}
}