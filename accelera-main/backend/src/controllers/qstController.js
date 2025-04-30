import pool from '../../db.js'; 
import {question} from '../models/question.js';


export const questionController ={
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

            // Validation des champs obligatoires
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
            const nouvellequestion= new question(
                null,
                texte_question,
                description|| null,
                type,
                obligatoire || false,
                programmeId
            )
            // Appel du modèle
    await question.create( nouvellequestion);

            res.status(201).json({message:'question créée'});
        }catch(err){
            res.status(500).json({error:'erreur serveur'});
            console.log("Erreur SQL:", err.message);
        }
    },
   // Dans le contrôleur
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

