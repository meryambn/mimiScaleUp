import pool from '../../db.js'; 
import {question} from '../models/question.js';


export const questionController ={
    //1 creation dune  nouvelle qst
    async createquestion(req,res){
        try{
            const programmeId= req.params.programmeid;
            console.log("programmeId reçu :", programmeId); // Vérifiez la valeur dans les logs
            const { 
                texte_question, 
                description, 
                type, 
                obligatoire,
            } = req.body;

            // verifier les champs qui doit etre remplie
  if (!texte_question) {
                return res.status(400).json({ 
                    error: "Champs manquants : texte_question"
                });
            }
if (!type ) {
                return res.status(400).json({ 
                    error: "Champs manquant :  type" 
                });
            }
if (!programmeId) {
                return res.status(400).json({ 
                    error: "Champs manquants :  programmeId" 
                });
            }
            // wela le type RadioButtons, Checkboxes, liste_deroulante lazem on ajoute des options
 if (['RadioButtons', 'Checkboxes', 'liste_deroulante'].includes(type)){
                if (!req.body.options || req.body.options.length === 0) {
                    return res.status(400).json({ 
                        error: "Les options sont obligatoires pour une liste déroulante" 
                    });
                }
            }
            // wela type evaluation lazem  + evalu_min et max
if (type === 'evaluation') {
                if (req.body.evaluation_min === undefined || req.body.evaluation_max === undefined) {
                    return res.status(400).json({ 
                        error: "Les bornes min/max sont obligatoires pour une évaluation" 
                    });
                }
if (req.body.evaluation_min >= req.body.evaluation_max) {
                    return res.status(400).json({ 
                        error: "La borne min doit être inférieure à la borne max" 
                    });
                }
            }
    // creation de lobjet qst
            const nouvellequestion= new question(
                null,
                texte_question,
                description|| null,
                type,
                obligatoire || false,
                programmeId,
                req.body.evaluation_min, 
                req.body.evaluation_max 
            )
            // Passer les options au modèle
        nouvellequestion.options = req.body.options || [];
          //appele de la methode
    await question.create( nouvellequestion);

            res.status(201).json({message:'question créée'});
        }catch(err){
            res.status(500).json({error:'erreur serveur'});
            console.log("Erreur SQL:", err.message);
        }
    },

   //2 eme supprimer une qst
async deletequestion(req, res) {
    try {
        const programmeId= req.params.programmeid; // À inclure dans la route
        console.log('id programme',programmeId);
        const questionId = req.params.questionId
        console.log('id question',questionId);
       
        const deleted = await question.delete(questionId,programmeId);
        
        if (!deleted) {
            return res.status(404).json({ 
                error: "Question introuvable dans ce programme" 
            });
        }
        
        res.status(200).json({ message: 'Question supprimée' });
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log("Erreur SQL:", err.message);
    }
},
// 3eme methode  pour modif une qst
async updatequestion(req, res) {
    try {
        const programmeId = req.params.programmeid;
        const questionId = req.params.questionId;
        const updates = req.body;

        // Validation des champs
        if (!programmeId || !questionId) {
            return res.status(400).json({ error: "IDs manquants" });
        }
        if (!updates.texte_question || !updates.type) {
            return res.status(400).json({ error: "Champs obligatoires manquants" });
        }
        if (updates.type === 'evaluation') {
            if (updates.evaluation_min === undefined || updates.evaluation_max === undefined) {
                return res.status(400).json({ 
                    error: "Les bornes min/max sont obligatoires pour une évaluation" 
                });
            }
            if (updates.evaluation_min >= updates.evaluation_max) {
                return res.status(400).json({ 
                    error: "La borne min doit être inférieure à la borne max" 
                });
            }
        }

        //si le type cest une liste deroulate et on veut changer de type alors on supprime les options du tupe liste deroulante 
        const oldTypeResult = await pool.query(
            'SELECT type FROM app_schema.questions WHERE id = $1',
            [questionId]
        );
        const oldType = oldTypeResult.rows[0]?.type;
        if (oldType === 'liste_deroulante' && updates.type !== 'liste_deroulante') {
            await pool.query(
                'DELETE FROM app_schema.question_options WHERE question_id = $1',
                [questionId]
            );
        }

        const updatedQuestion = await question.update(
            questionId, 
            programmeId, 
            {
                texte_question: updates.texte_question,
                description: updates.description || null,
                type: updates.type,
                obligatoire: updates.obligatoire || false
            }
        );

        if (!updatedQuestion) {
            return res.status(404).json({ error: "Question introuvable" });
        }

        res.status(200).json(updatedQuestion);
    } catch (err) {
       
       
            res.status(500).json({ error: err.message });
            console.log("Erreur SQL:", err.message);
        };
    },
    // 4eme recuperer toute les qst dun programme
    async getquestion(req,res){
        try{
            const programmeId=req.params.programmeid;
            const questions= await question.getallByprogId(programmeId)
            res.status(200).json(questions);
    
        }catch(err){
            res.status(500).json({ error: 'Erreur serveur' });
            console.log("Erreur SQL:", err.message);
        }
     },
}

