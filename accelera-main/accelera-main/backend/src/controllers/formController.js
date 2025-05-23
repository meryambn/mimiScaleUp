import pool from '../../db.js'; 
import {Formulaire} from '../models/formulaire.js';
import {question} from '../models/question.js'

export const formController ={
    //1 ere methode creer un form
    async createform(req,res){
        try{
            const programmeId= req.params.programme_id;
            console.log("programmeId reçu :", programmeId); // Vérifiez la valeur dans les logs
            const { 
                titre, 
                url_formulaire, 
                description,
                message_confirmation 
            } = req.body;

            // Validation des champs obligatoires
            if (! titre) {
                return res.status(400).json({ 
                    error: "Champs manquants : texte_question"
                });
            }
            if (!url_formulaire ) {
                return res.status(400).json({ 
                    error: "Champs manquant :  type" 
                });
            }
           

            const nouveauform= new Formulaire(
                null,
                titre,
                url_formulaire,
                description,
                message_confirmation ,
                programmeId,
                
            )
         
    await Formulaire.create( nouveauform);

            res.status(201).json({message:'form créée'});
        }catch(err){
            res.status(500).json({error:'erreur serveur'});
            console.log("Erreur SQL:", err.message);
        }
    },
    // 2eme methode Récupère un formulaire complet avec ses questions associées
    async getFullForm(req, res) {
        try {
          const programmeId = req.params.programme_id;
          console.log("id programme",programmeId)
          // Récupération du formulaire de base
          const formulaire = await Formulaire.getByProgId(programmeId);
         //si form existe pas 
          if (!formulaire) {
            return res.status(404).json({ error: "Formulaire introuvable" });
          }
    
          // Récupération des questions associées
          const questions = await question.getallByprogId(programmeId);
    
          res.status(200).json({
            formulaire: {
              ...formulaire,//inclure toute les propietes du form
              questions: questions
            }
          });
    
        } catch (err) {
          res.status(500).json({ error: 'Erreur serveur' });
          console.log("Erreur SQL:", err.message);
        }
      },
//3 eme methode supprimer le form+les qsts a linterieur d'un form
      async deleteForm(req, res) {
      
        try {
            const programmeId = req.params.programme_id;
    
            // Suppression en cascade
            await question.deletetouteqst(programmeId);
            await Formulaire.delete(programmeId);
    
           
            res.status(200).json({ message: 'Suppression complète réussie' });
        } catch (err) {
           
            res.status(500).json({ error: err.message });
        } },


        
      };
