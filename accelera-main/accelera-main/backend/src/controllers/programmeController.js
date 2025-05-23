import { Programme } from '../models/programme.js';
import { Notification } from '../models/notification.js';
import { AdminMentor } from '../models/adminMentor.js';
import { ProgrammeSoumission } from '../models/programmeSoumission.js';
import { Candidature } from '../models/candidature.js';
import { CandidatureMembre } from '../models/candidatureMembre.js';
import pool from '../../db.js';

export const programmeController = {
  //1 methode creer un programme
  async createProgramme(req, res) {
    try {
      //recuperation des donnees du corps de la requete
      const {
        type,
        nom,
        description,
        date_debut,
        date_fin,
        phases_requises,
        industries_requises,
        documents_requis,
        taille_equipe_min,
        taille_equipe_max,
        ca_min,
        ca_max,
        admin_id = 1,
        status = 'Brouillon',
        is_template = 'Non-Modèle'
      } = req.body;

      //verifie si datedebut et date de fin sont valides
      if (date_debut > date_fin){
        return res.status(400).json({error:'date de dabut doit etre inf a date de fin'})
      }

      // verifier si le type de programme est valide
      const validTypes = ['Accélération', 'Incubation', 'Hackathon', 'Défi d\'innovation', 'Personnalisé'];

      // si le type de programme nest pas valide (il appartient pas el les types li jai declarer)
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Type de programme invalide' });
      }

      // Vérifier si le statut est valide
      const validStatuses = ['Brouillon', 'Actif', 'Terminé'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Statut de programme invalide' });
      }

      // Vérifier si is_template est valide
      const validTemplateValues = ['Modèle', 'Non-Modèle'];
      if (!validTemplateValues.includes(is_template)) {
        return res.status(400).json({ error: 'Valeur de modèle invalide' });
      }

      // Création du programme
      const newProgramme = new Programme(
        null, // id généré automatiquement
        type,
        nom,
        description,
        date_debut,
        date_fin,
        phases_requises || [],
        industries_requises || [],
        documents_requis || [],
        taille_equipe_min || 1,
        taille_equipe_max || 8,
        ca_min || 0,
        ca_max || 500000,
        admin_id,
        status,
        is_template
      );
//insertion dans la BDD avec appel de la methode create de programme
const programmeId = await Programme.create(newProgramme);

//si programme creer envoyer son id
      res.status(201).json({
        id: programmeId,
        message: 'Programme créé avec succès',

      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },



  // 2 methode recuperer les infos d'un programme avec ses mentors associés
  async getProgrammeDetails(req, res) { // <-- Nom exact ici
    try {

      const programmeId = req.params.id;
      const programme = await Programme.getProgrammeWithMentors(programmeId);
      //si programme nexiste pas
      if (!programme) {
        return res.status(404).json({ error: 'Programme non trouvé' });
      }
      //si existe
      res.json(programme);
    } catch (error) {
      res.status(500).json({
        error: 'Erreur lors de la récupération du programme',
        details: error.message
      });
    }
  },



  // 3 eme methode Ajout d'un mentor à un programme
  async addmetor(req,res){
        try {
          const { mentorId } = req.body;
          const programmeId = req.params.id;

          //verifie si le corps de la requete contient lid du mentor et lid du programme dans la requete
          if (!mentorId) {
            return res.status(400).json({ error: "ID manquant mentor" });
          }

          if (!programmeId) {
            return res.status(400).json({ error: "ID manquant programme" });
          }

          // Vérifiez d'abord si le mentor et le programme existent dans la BDD
          const mentorExists = await pool.query(
            'SELECT 1 FROM app_schema.mentors WHERE utilisateur_id = $1',
            [mentorId]
          );

          const programmeExists = await pool.query(
            'SELECT 1 FROM app_schema.programme WHERE id = $1',
            [programmeId]
          );

          //si l'un des deux nexiste pas dans la BDD
          if (!mentorExists.rows.length) {
            return res.status(404).json({ error: "Mentor non trouvé" });
          }

          if (!programmeExists.rows.length) {
            return res.status(404).json({ error: "Programme non trouvé" });
          }

          //ajout du mentor au programme
          await Programme.addMentorToProgramme(programmeId, mentorId);

 // Get program details for the notification
 const programResult = await pool.query(
   'SELECT nom FROM app_schema.programme WHERE id = $1',
   [programmeId]
 );

 const programName = programResult.rows.length > 0 ? programResult.rows[0].nom : 'Un programme';

 // Create a notification for the mentor
 await Notification.create({
   user_id: mentorId,
   user_role: 'mentor',
   type: 'program_invitation',
   title: 'Invitation à un programme',
   message: `Vous avez été ajouté au programme "${programName}".`,
   related_id: parseInt(programmeId),
   is_read: false
 });

     res.status(200).json({ message: 'Mentor ajouté avec succès' });
        } catch (error) {
            console.error("Erreur détaillée:", error);
            res.status(500).json({
                error: "Échec de l'ajout du mentor",
                details: error.message
            });
        }
    },

//4 eme methode delete le mentor d'un programme
    async delmentor(req,res){
      try{
        const{programmeId,mentorId}=req.params;
        if (!mentorId ) {
          return res.status(400).json({ error: "ID manquant  mentor" });
              }
    if ( !programmeId) {
       return res.status(400).json({ error: "ID manquant programme" });
              }
               await Programme.deletementor(programmeId,mentorId)
               res.status(200).json({message: 'mentor retirer avec succes'});

      }catch(err){
        res.status(500).json({ error:'erreur serveur'})
      }
    },




    // 4 eme methode modifier un programme
    async updateProgramme(req,res){
      try{
const {programmeId}=req.params;
console.log("id",programmeId)
const updatedData=req.body;

  //on verifie si le programme exista
  const exist = await Programme.findById(programmeId);
  if(!exist){
    return res.status(404).json({error:'programme nexiste pas'});
  }
 // date_debut = new Date(date_debut + 'T00:00:00Z');
//date_fin = new Date(date_fin + 'T23:59:59Z');
  const updatedProgramme = await Programme.updateProgramme(programmeId,updatedData);

  res.status(200).json({
      success: true,
      data: updatedProgramme
  });

      }catch(err){
        res.status(500).json({error:'erreur serveur'});
        console.log("Erreur SQL:", err.message);
      }


    },
    //5 eme methode suppression dun programme
    async deleteProgramme(req, res) {
      try {
        // appel de la methode de suppression
        await Programme.delete(req.params.id);
        //si suppression
        res.status(200).json({ message: 'Programme supprimé avec succès' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    // Récupérer tous les programmes auxquels un mentor est assigné
    async getMentorPrograms(req, res) {
      try {
        const mentorId = req.params.mentorId;

        if (!mentorId) {
          return res.status(400).json({ error: "ID du mentor manquant" });
        }

        // Vérifier si le mentor existe
        const mentorExists = await pool.query(
          'SELECT 1 FROM app_schema.mentors WHERE utilisateur_id = $1',
          [mentorId]
        );

        if (mentorExists.rows.length === 0) {
          return res.status(404).json({ error: "Mentor non trouvé" });
        }

        // Récupérer les programmes du mentor
        const programmes = await Programme.getProgrammesByMentorId(mentorId);

        res.status(200).json(programmes);
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors de la récupération des programmes",
          details: error.message
        });
      }
    },

    async addMentorToProgram(req, res) {
    try {
      const { mentorId } = req.body;
      const programmeId = req.params.id;
      const admin_id = req.headers['x-admin-id'] || req.admin_id || 1; // Get from header, authenticated admin, or default to 1

      if (!mentorId || !programmeId) {
        return res.status(400).json({ error: "ID manquant mentor ou programme" });
      }

      // Check if mentor is in admin's pool
      console.log(`Checking if mentor ${mentorId} is in admin ${admin_id}'s pool...`);
      const isMentorInPool = await AdminMentor.isMentorInAdminPool(admin_id, mentorId);
      console.log(`Is mentor in pool: ${isMentorInPool}`);

      if (!isMentorInPool) {
        console.log(`Mentor ${mentorId} is not in admin ${admin_id}'s pool. Rejecting request.`);
        return res.status(403).json({ error: "Ce mentor n'est pas dans votre pool de mentors" });
      }

      console.log(`Mentor ${mentorId} is in admin ${admin_id}'s pool. Proceeding with adding to program.`);

      // Get the mentor ID column name
      const idColumn = await AdminMentor.getMentorIdColumn();

      // Check if mentor and program exist
      const mentorExists = await pool.query(
        `SELECT 1 FROM app_schema.mentors WHERE ${idColumn} = $1`,
        [mentorId]
      );

      const programmeExists = await pool.query(
        'SELECT 1 FROM app_schema.programme WHERE id = $1',
        [programmeId]
      );

      if (!mentorExists.rows.length || !programmeExists.rows.length) {
        return res.status(404).json({ error: "Mentor ou programme non trouvé" });
      }

      // Add mentor to program
      await Programme.addMentorToProgramme(programmeId, mentorId);

      // Get program details for the notification
      const programResult = await pool.query(
        'SELECT nom FROM app_schema.programme WHERE id = $1',
        [programmeId]
      );

      const programName = programResult.rows.length > 0 ? programResult.rows[0].nom : 'Un programme';

      // Create a notification for the mentor
      await Notification.create({
        user_id: mentorId,
        user_role: 'mentor',
        type: 'program_invitation',
        title: 'Invitation à un programme',
        message: `Vous avez été ajouté au programme "${programName}".`,
        related_id: parseInt(programmeId),
        is_read: false
      });

      res.status(200).json({ message: 'Mentor ajouté avec succès au programme' });
    } catch (error) {
      console.error("Erreur détaillée:", error);
      res.status(500).json({
        error: "Échec de l'ajout du mentor au programme",
        details: error.message
      });
    }
  },

  // 6ème méthode: Mettre à jour le statut d'un programme
  async updateProgramStatus(req, res) {
    try {
      const { programmeId } = req.params;
      const { status, is_template } = req.body;

      // Vérifier si le statut est valide
      const validStatuses = ['Brouillon', 'Actif', 'Terminé'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Statut de programme invalide' });
      }

      // Vérifier si is_template est valide si fourni
      if (is_template && !['Modèle', 'Non-Modèle'].includes(is_template)) {
        return res.status(400).json({ error: 'Valeur de modèle invalide' });
      }

      try {
        // Mettre à jour le statut du programme
        const updatedProgramme = await Programme.updateStatus(programmeId, status, is_template);

        // Si le statut est passé à "Terminé", envoyer des notifications aux mentors et participants
        if (status === 'Terminé') {
          // Récupérer les informations du programme
          const programResult = await pool.query(
            'SELECT nom FROM app_schema.programme WHERE id = $1',
            [programmeId]
          );
          const programName = programResult.rows.length > 0 ? programResult.rows[0].nom : 'Un programme';

          // Récupérer tous les mentors associés au programme
          const { rows: mentors } = await pool.query(
            `SELECT mentor_id
             FROM app_schema.programme_mentors
             WHERE programme_id = $1`,
            [programmeId]
          );

          // Envoyer une notification à chaque mentor
          for (const mentor of mentors) {
            await Notification.create({
              user_id: mentor.mentor_id,
              user_role: 'mentor',
              type: 'program_completed',
              title: 'Programme terminé',
              message: `Le programme "${programName}" a été marqué comme terminé.`,
              related_id: parseInt(programmeId),
              is_read: false
            });
          }

          // Récupérer tous les participants (équipes et startups individuelles) du programme

          // 1. Récupérer les startups individuelles
          const individualStartups = await ProgrammeSoumission.getIndividualSubmissions(programmeId);

          // 2. Récupérer les équipes du programme
          const teams = await Candidature.getByProgramme(programmeId);

          // 3. Envoyer des notifications aux startups individuelles
          for (const startup of individualStartups) {
            try {
              // Récupérer l'ID de l'utilisateur associé à cette soumission
              const { rows: userRows } = await pool.query(
                `SELECT s.utilisateur_id
                 FROM app_schema.soumissions s
                 WHERE s.id = $1`,
                [startup.soumission_id]
              );

              if (userRows.length > 0) {
                const userId = userRows[0].utilisateur_id;

                await Notification.create({
                  user_id: userId,
                  user_role: 'startup',
                  type: 'program_completed',
                  title: 'Programme terminé',
                  message: `Le programme "${programName}" a été marqué comme terminé. Merci pour votre participation.`,
                  related_id: parseInt(programmeId),
                  is_read: false
                });
              }
            } catch (notifError) {
              console.error(`Erreur lors de la création de notification pour la startup ${startup.soumission_id}:`, notifError);
              // Continuer avec les autres notifications même si une échoue
            }
          }

          // 4. Pour chaque équipe, récupérer les membres et envoyer des notifications
          for (const team of teams) {
            try {
              // Récupérer les membres de l'équipe
              const membres = await CandidatureMembre.getByCandidature(team.id);

              for (const membreId of membres) {
                // Récupérer l'ID de l'utilisateur associé à cette soumission
                const { rows: userRows } = await pool.query(
                  `SELECT s.utilisateur_id, s.role
                   FROM app_schema.soumissions s
                   WHERE s.id = $1`,
                  [membreId]
                );

                if (userRows.length > 0) {
                  const userId = userRows[0].utilisateur_id;
                  const userRole = userRows[0].role;

                  await Notification.create({
                    user_id: userId,
                    user_role: userRole,
                    type: 'program_completed',
                    title: 'Programme terminé',
                    message: `Le programme "${programName}" a été marqué comme terminé. Merci pour votre participation.`,
                    related_id: parseInt(programmeId),
                    is_read: false
                  });
                }
              }
            } catch (teamNotifError) {
              console.error(`Erreur lors de la création de notifications pour l'équipe ${team.id}:`, teamNotifError);
              // Continuer avec les autres équipes même si une échoue
            }
          }
        }

        res.status(200).json({
          message: 'Statut du programme mis à jour avec succès',
          programme: updatedProgramme
        });
      } catch (error) {
        // Gérer les erreurs spécifiques de validation des règles de transition
        if (error.message.includes('Impossible de changer')) {
          return res.status(400).json({ error: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      res.status(500).json({
        error: 'Erreur lors de la mise à jour du statut du programme',
        details: error.message
      });
    }
  },

  // 7ème méthode: Récupérer tous les programmes qui sont des modèles
  async getTemplatePrograms(req, res) {
    try {
      // Récupérer tous les programmes qui ont is_template = 'Modèle'
      const query = `
        SELECT p.*
        FROM app_schema.programme p
        WHERE p.is_template = 'Modèle'
        ORDER BY p.id DESC
      `;

      const { rows } = await pool.query(query);

      // For each program, try to get mentors if they exist
      for (const program of rows) {
        try {
          const mentorsQuery = `
            SELECT json_build_object(
              'utilisateur_id', m.utilisateur_id,
              'email', m.email,
              'profession', m.profession,
              'bio', m.bio
            ) as mentor
            FROM app_schema.programme_mentors pm
            JOIN app_schema.mentors m ON pm.mentor_id = m.utilisateur_id
            WHERE pm.programme_id = $1
          `;

          const mentorsResult = await pool.query(mentorsQuery, [program.id]);
          program.mentors = mentorsResult.rows.map(row => row.mentor);
        } catch (mentorError) {
          console.error('Erreur lors de la récupération des mentors pour le programme:', mentorError);
          program.mentors = [];
        }
      }

      res.status(200).json(rows);
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles de programme:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des modèles de programme',
        details: error.message
      });
    }
  },

  // 8ème méthode: Récupérer tous les programmes
  async getAllPrograms(req, res) {
    try {
      // Get admin_id from request headers or query parameters
      const admin_id = req.headers['x-admin-id'] || req.query.admin_id || req.admin_id;

      // Utiliser la méthode du modèle pour récupérer tous les programmes avec leurs mentors
      const programmes = await Programme.getAllProgrammes(admin_id);

      res.status(200).json(programmes);
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les programmes:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération de tous les programmes',
        details: error.message
      });
    }
  }
}