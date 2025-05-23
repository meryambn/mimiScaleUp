
import db from '../../db.js';
import pool from '../../db.js';
import { Soumission } from '../models/soumissions.js';
import { Reponse } from '../models/reponses.js';
import { equipe } from '../models/equipe.js';
import { Notification } from '../models/notification.js';

export const soumissionController ={

    async createsoum(req,res){
      try{
        const{formulaire_id,  utilisateur_id, role,reponses}=req.body;

        // Vérifier si l'utilisateur a déjà soumis ce formulaire
        const hasSubmitted = await Soumission.hasUserSubmitted(formulaire_id, utilisateur_id);
        if (hasSubmitted) {
          return res.status(400).json({
            error: 'Vous avez déjà soumis ce formulaire'
          });
        }

        const nouvellesoum = new Soumission(
            null,
            formulaire_id,
            utilisateur_id,
            role,

        );
        const soumission = await Soumission.create(nouvellesoum);
        if (!soumission?.id) {
          throw new Error("Échec de la création de la soumission");
        }
        for (const rep of reponses) {
          await Reponse.create({
            soumission_id: soumission.id, // Passer un objet avec les clés
            question_id: rep.question_id,
            valeur: rep.valeur
        });
        }

        // Get formulaire and programme details
        const { rows: formulaireRows } = await pool.query(
          `SELECT f.*, p.nom as programme_nom, p.admin_id
           FROM app_schema.formulaires f
           JOIN app_schema.programme p ON f.programme_id = p.id
           WHERE f.id = $1`,
          [formulaire_id]
        );

        if (formulaireRows.length > 0) {
          const formulaire = formulaireRows[0];
          const programmeId = formulaire.programme_id;
          const adminId = formulaire.admin_id;
          const programmeName = formulaire.programme_nom;

          // Get user details for notification message
          let userName = '';
          if (role === 'startup') {
            const { rows: startupRows } = await pool.query(
              'SELECT nom_entreprise FROM app_schema.startups WHERE utilisateur_id = $1',
              [utilisateur_id]
            );
            userName = startupRows.length > 0 ? startupRows[0].nom_entreprise : 'Une startup';
          } else if (role === 'particulier') {
            const { rows: particulierRows } = await pool.query(
              'SELECT nom, prenom FROM app_schema.particuliers WHERE utilisateur_id = $1',
              [utilisateur_id]
            );
            userName = particulierRows.length > 0
              ? `${particulierRows[0].prenom} ${particulierRows[0].nom}`
              : 'Un particulier';
          }

          // Create notification for admin
          try {
            await Notification.create({
              user_id: adminId,
              user_role: 'admin',
              type: 'new_submission',
              title: 'Nouvelle soumission',
              message: `${userName} a soumis une candidature pour le programme "${programmeName}".`,
              related_id: soumission.id,
              is_read: false
            });
            console.log(`Notification created for admin ID: ${adminId}`);
          } catch (adminNotifError) {
            console.error(`Error creating notification for admin ${adminId}:`, adminNotifError.message);
            // Continue with mentor notifications even if admin notification fails
          }

          // Get mentors associated with the programme
          const { rows: mentorRows } = await pool.query(
            `SELECT mentor_id
             FROM app_schema.programme_mentors
             WHERE programme_id = $1`,
            [programmeId]
          );

          // Create notifications for all mentors
          for (const mentorRow of mentorRows) {
            try {
              await Notification.create({
                user_id: mentorRow.mentor_id,
                user_role: 'mentor',
                type: 'new_submission',
                title: 'Nouvelle soumission',
                message: `${userName} a soumis une candidature pour le programme "${programmeName}".`,
                related_id: soumission.id,
                is_read: false
              });
              console.log(`Notification created for mentor ID: ${mentorRow.mentor_id}`);
            } catch (notifError) {
              console.error(`Error creating notification for mentor ${mentorRow.mentor_id}:`, notifError.message);
              // Continue with other mentors even if one fails
            }
          }
        }

        res.status(201).json({
          message: 'Soumission enregistrée',
          soumission_id: soumission.id
        });


      }catch(err){
        res.status(500).json({error:'erreur serveur'});
        console.log("Erreur SQL:", err.message);
      }  },
  //2eme methode pour afficher le form avec qst et reponses
      async lireSoumissionAvecReponses(req, res) {
        try {

            const soumissionId = req.params.id;
            console.log('id de soumission',soumissionId)
            const soumission = await Soumission.getByIdWithDetails(soumissionId);
            const reponses = await Reponse.findBySoumissionWithQuestions(soumissionId);

         let nombreEquipe = 1; // Par défaut pour particulier
          if (soumission.role === 'startup') {
            console.log('le role',soumission.role)
            // Appel à une nouvelle méthode pour compter les membres
            const { rows } = await pool.query(
                `SELECT COUNT(*)
                FROM app_schema.equipe
                WHERE startup_id = $1`,
                [soumission.utilisateur_id]
            );
            nombreEquipe = (parseInt(rows[0].count) || 0) + 1;
        }


            const resultat = {
                formulaire: {
                    id: soumission.formulaire_id,
                    titre: soumission.formulaire_titre,
                    description: soumission.formulaire_description
                },
                utilisateur: {
                    id: soumission.utilisateur_id,
                    email: soumission.email,
                    role: soumission.role
                },
                questions: reponses.map(reponse => ({
                    id: reponse.question_id,
                    texte_question: reponse.texte_question,
                    description: reponse.question_description,
                    type: reponse.question_type,
                    obligatoire: reponse.question_obligatoire,
                    evaluation_min: reponse.evaluation_min,
                    evaluation_max: reponse.evaluation_max,
                    reponse: {
                        id: reponse.id,
                        valeur: reponse.valeur
                    },
                     nombre_equipe: nombreEquipe
                }))
            };

            res.status(200).json(resultat);

        } catch (err) {
            console.error('Erreur lecture soumission :', err);
            res.status(500).json({ error: 'Impossible de récupérer la soumission' });
        }
    },

    // 3ème méthode pour récupérer toutes les soumissions d'un programme
    async getSoumissionsByProgramme(req, res) {
        try {
            const programmeId = req.params.programmeId;
            console.log('Récupération des soumissions pour le programme:', programmeId);

            // Récupérer toutes les soumissions pour ce programme
            const soumissions = await Soumission.getByProgrammeId(programmeId);

            if (!soumissions || soumissions.length === 0) {
                return res.status(200).json([]);
            }

            // Pour chaque soumission, récupérer les réponses
            const soumissionsAvecReponses = await Promise.all(soumissions.map(async (soumission) => {
                const reponses = await Reponse.findBySoumissionWithQuestions(soumission.id);

                // Calculer la taille de l'équipe pour les startups
                let teamSize = 1; // Par défaut pour particulier
                if (soumission.role === 'startup') {
                    const { rows } = await pool.query(
                        `SELECT COUNT(*)
                        FROM app_schema.equipe
                        WHERE startup_id = $1`,
                        [soumission.utilisateur_id]
                    );
                    teamSize = (parseInt(rows[0].count) || 0) + 1;
                }

                // Construire un objet avec les informations nécessaires
                return {
                    id: soumission.id,
                    programId: soumission.programme_id,
                    formId: soumission.formulaire_id,
                    teamName: soumission.role === 'startup'
                        ? soumission.utilisateur_nom
                        : `${soumission.utilisateur_prenom} ${soumission.utilisateur_nom}`,
                    teamEmail: soumission.email,
                    teamSize: teamSize,
                    role: soumission.role,
                    status: 'pending', // Par défaut
                    submittedAt: soumission.created_at ? new Date(soumission.created_at).toISOString() : new Date().toISOString(),
                    formData: reponses.reduce((acc, reponse) => {
                        acc[reponse.texte_question] = reponse.valeur;
                        return acc;
                    }, {})
                };
            }));

            res.status(200).json(soumissionsAvecReponses);

        } catch (err) {
            console.error('Erreur récupération soumissions :', err);
            res.status(500).json({ error: 'Impossible de récupérer les soumissions' });
        }
    },

    // 4ème méthode pour vérifier si un utilisateur a déjà soumis un formulaire
    async checkIfSubmitted(req, res) {
      const { formulaire_id, utilisateur_id } = req.query;
      if (!formulaire_id || !utilisateur_id) {
        return res.status(400).json({ error: 'Paramètres manquants' });
      }
      try {
        const hasSubmitted = await Soumission.hasUserSubmitted(formulaire_id, utilisateur_id);
        res.json({ hasSubmitted });
      } catch (err) {
        console.error('Erreur vérification soumission :', err);
        res.status(500).json({ error: 'Erreur serveur' });
      }
    }
}



