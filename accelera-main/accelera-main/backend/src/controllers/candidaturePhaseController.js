import pool from '../../db.js';
import { candidaturePhase } from '../models/candidaturePhase.js';
import { Candidature } from '../models/candidature.js';
import { CandidatureMembre } from '../models/candidatureMembre.js';
import { ProgrammeSoumission } from '../models/programmeSoumission.js';
import { Notification } from '../models/notification.js';

export const CandidaturePhaseController = {
  // Méthode pour obtenir la phase actuelle d'une candidature
  async getCurrentPhase(req, res) {
    try {
      const { candidatureId } = req.params;

      if (!candidatureId) {
        return res.status(400).json({ error: "ID de candidature manquant" });
      }

      // Vérifier que la candidature existe
      const { rows: candidature } = await pool.query(
        "SELECT * FROM app_schema.candidatures WHERE id = $1",
        [candidatureId]
      );

      if (candidature.length === 0) {
        return res.status(404).json({ error: "Candidature introuvable" });
      }

      // Obtenir la phase actuelle
      const currentPhase = await candidaturePhase.getCurrentPhase(candidatureId);

      if (!currentPhase) {
        return res.status(404).json({ error: "Aucune phase trouvée pour cette candidature" });
      }

      res.status(200).json(currentPhase);
    } catch (err) {
      console.error("Erreur lors de la récupération de la phase actuelle:", err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Méthode unifiée pour avancer soit une équipe, soit une startup
  async avancerPhaseUnified(req, res) {
    try {
      const { entiteType, entiteId, phaseNextId, programmeId } = req.body;

      // Vérifier les paramètres requis
      if (!entiteType || !entiteId || !phaseNextId || !programmeId) {
        return res.status(400).json({
          error: "Paramètres manquants - entiteType, entiteId, phaseNextId et programmeId sont requis"
        });
      }

      // Vérifier que la phase cible existe
      const { rows: phaseNext } = await pool.query(
        "SELECT * FROM app_schema.phase WHERE id = $1 AND programme_id = $2",
        [phaseNextId, programmeId]
      );

      if (phaseNext.length === 0) {
        return res.status(404).json({ error: "Phase cible introuvable ou n'appartient pas au programme spécifié" });
      }

      let candidatureId;
      let nom;
      let message;

      // Traitement selon le type d'entité (équipe ou startup)
      if (entiteType === 'equipe') {
        // Cas d'une équipe: l'ID est déjà celui d'une candidature
        const { rows: equipe } = await pool.query(
          "SELECT * FROM app_schema.candidatures WHERE id = $1",
          [entiteId]
        );

        if (equipe.length === 0) {
          return res.status(404).json({ error: "Équipe introuvable" });
        }

        candidatureId = entiteId;
        nom = equipe[0].nom_equipe;
        message = "L'équipe a été avancée à la phase suivante avec succès";
      }
      else if (entiteType === 'startup') {
        // Cas d'une startup: l'ID est celui d'une soumission
        const soumission = await ProgrammeSoumission.checkSoumissionExists(entiteId);
        if (!soumission) {
          return res.status(404).json({ error: "Startup introuvable" });
        }

        // Vérifier si la startup est déjà dans une candidature
        const { rows: candidatureExistante } = await pool.query(
          "SELECT candidatures_id FROM app_schema.candidatures_membres WHERE soumission_id = $1",
          [entiteId]
        );

        if (candidatureExistante.length > 0) {
          // Utiliser la candidature existante
          candidatureId = candidatureExistante[0].candidatures_id;

          // Vérifier si c'est une candidature individuelle
          const { rows: infosCandidature } = await pool.query(
            "SELECT * FROM app_schema.candidatures WHERE id = $1",
            [candidatureId]
          );

          // Si la candidature est une équipe avec plusieurs membres, créer une nouvelle candidature individuelle
          const { rows: membresCandidature } = await pool.query(
            "SELECT COUNT(*) as nb_membres FROM app_schema.candidatures_membres WHERE candidatures_id = $1",
            [candidatureId]
          );

          if (membresCandidature[0].nb_membres > 1) {
            // Créer une nouvelle candidature individuelle
            // Utiliser le nom d'entreprise de la soumission s'il existe, sinon utiliser celui de la requête
            const nomStartup = soumission.nom_entreprise || req.body.nom_entreprise || `Startup ${entiteId}`;
            console.log(`Création d'une candidature avec le nom: ${nomStartup}`);
            const nouvelleCandidature = await Candidature.create(
              nomStartup,
              `Candidature individuelle de ${nomStartup}`,
              programmeId,
              'startup_individuelle'
            );

            candidatureId = nouvelleCandidature.id;

            // Lier la soumission à cette candidature
            await CandidatureMembre.lierSoumission(candidatureId, entiteId);
          }
        }
        else {
          // Créer une candidature pour cette startup
          // Utiliser le nom d'entreprise de la soumission s'il existe, sinon utiliser celui de la requête
          const nomStartup = soumission.nom_entreprise || req.body.nom_entreprise || `Startup ${entiteId}`;
          console.log(`Création d'une candidature avec le nom: ${nomStartup}`);
          const nouvelleCandidature = await Candidature.create(
            nomStartup,
            `Candidature individuelle de ${nomStartup}`,
            programmeId,
            'startup_individuelle'
          );

          candidatureId = nouvelleCandidature.id;

          // Lier la soumission à cette candidature
          await CandidatureMembre.lierSoumission(candidatureId, entiteId);
        }

        // Utiliser le nom d'entreprise de la soumission s'il existe, sinon utiliser celui de la requête
        nom = soumission.nom_entreprise || req.body.nom_entreprise || `Startup ${entiteId}`;
        console.log(`Nom utilisé pour la réponse: ${nom}`);
        message = "La startup a été avancée à la phase suivante avec succès";
      }
      else {
        return res.status(400).json({
          error: "Type d'entité invalide. Utilisez 'equipe' ou 'startup'"
        });
      }

      // Obtenir la phase actuelle
      const phaseActuelle = await candidaturePhase.getCurrentPhase(candidatureId);

      // Ajouter la candidature à la nouvelle phase
      await candidaturePhase.addToPhase(candidatureId, phaseNextId);

      // Récupérer le nom du programme pour la notification
      const { rows: programRows } = await pool.query(
        "SELECT nom FROM app_schema.programme WHERE id = $1",
        [programmeId]
      );
      const programmeName = programRows.length > 0 ? programRows[0].nom : "Programme";

      // Envoyer une notification à la startup/équipe
      if (entiteType === 'startup') {
        // Pour une startup individuelle, récupérer l'utilisateur_id
        const soumission = await ProgrammeSoumission.checkSoumissionExists(entiteId);
        if (soumission) {
          try {
            // Vérifier si la startup est dans une équipe ou est individuelle
            // Compter le nombre de membres dans la candidature
            const { rows: membresCount } = await pool.query(
              "SELECT COUNT(*) as nb_membres FROM app_schema.candidatures_membres WHERE candidatures_id = $1",
              [candidatureId]
            );

            let message;
            // Si la candidature a plus d'un membre, c'est une équipe
            if (membresCount.length > 0 && parseInt(membresCount[0].nb_membres) > 1) {
              message = `Votre équipe "${nom}" a avancé à la phase "${phaseNext[0].nom}" dans le programme "${programmeName}".`;
            } else {
              message = `Votre startup individuelle a avancé à la phase "${phaseNext[0].nom}" dans le programme "${programmeName}".`;
            }

            await Notification.create({
              user_id: soumission.utilisateur_id,
              user_role: 'startup',
              type: 'phase_advancement',
              title: 'Avancement de phase',
              message: message,
              related_id: parseInt(programmeId),
              is_read: false
            });
            console.log(`Notification créée pour la startup ${soumission.utilisateur_id}`);
          } catch (notifError) {
            console.error(`Erreur lors de la création de la notification pour la startup ${soumission.utilisateur_id}:`, notifError.message);
            // Continuer même si la création de notification échoue
          }
        }
      } else if (entiteType === 'equipe') {
        // Pour une équipe, récupérer tous les membres et envoyer une notification à chacun
        const membres = await CandidatureMembre.getByCandidature(candidatureId);
        for (const membreId of membres) {
          const soumission = await ProgrammeSoumission.checkSoumissionExists(membreId);
          if (soumission) {
            try {
              await Notification.create({
                user_id: soumission.utilisateur_id,
                user_role: 'startup',
                type: 'phase_advancement',
                title: 'Avancement de phase',
                message: `Votre équipe "${nom}" a avancé à la phase "${phaseNext[0].nom}" dans le programme "${programmeName}".`,
                related_id: parseInt(programmeId),
                is_read: false
              });
              console.log(`Notification créée pour le membre d'équipe ${soumission.utilisateur_id}`);
            } catch (notifError) {
              console.error(`Erreur lors de la création de la notification pour le membre d'équipe ${soumission.utilisateur_id}:`, notifError.message);
              // Continuer même si la création de notification échoue
            }
          }
        }
      }

      res.status(200).json({
        message,
        nom,
        entiteType,
        entiteId,
        phase_precedente: phaseActuelle ? phaseActuelle.nom : "Aucune",
        nouvelle_phase: phaseNext[0].nom,
        candidature_id: candidatureId
      });

    } catch (err) {
      console.error("Erreur lors de l'avancement de phase:", err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Méthode pour déclarer un gagnant pour une phase
  async declarerGagnantPhase(req, res) {
    try {
      const { phaseId, candidatureId } = req.body;

      // Étape 1 : Vérifier les paramètres
      if (!phaseId || !candidatureId) {
        return res.status(400).json({ error: "Paramètres manquants" });
      }

      // Étape 2 : Vérifier si c'est la dernière phase
      const isLastPhase = await candidaturePhase.isLastPhase(phaseId);
      if (!isLastPhase) {
        return res.status(400).json({ error: "Seule la dernière phase peut avoir un gagnant" });
      }

      // Étape 3 : Vérifier que la candidature et la phase sont dans le même programme
      const phase = await pool.query('SELECT programme_id FROM app_schema.phase WHERE id = $1', [phaseId]);
      const candidature = await pool.query('SELECT programme_id FROM app_schema.candidatures WHERE id = $1', [candidatureId]);

      if (phase.rows[0].programme_id !== candidature.rows[0].programme_id) {
        return res.status(400).json({ error: "Programme différent" });
      }

      // Étape 4 : Vérifier si la phase peut avoir un gagnant
      // Vérifier si la colonne gagnant_candidature_id existe dans la table phase
      const { rows: phaseColumns } = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'app_schema'
        AND table_name = 'phase'
        AND column_name = 'gagnant_candidature_id'
      `);

      // Si la colonne existe, on peut continuer
      if (phaseColumns.length > 0) {
        // Étape 5 : Enregistrer le gagnant
        const phaseMiseAJour = await candidaturePhase.setPhaseWinner(phaseId, candidatureId);

        // Récupérer les informations sur le programme et la candidature gagnante
        const programmeId = phase.rows[0].programme_id;
        const { rows: programmeRows } = await pool.query(
          "SELECT nom FROM app_schema.programme WHERE id = $1",
          [programmeId]
        );
        const programmeName = programmeRows.length > 0 ? programmeRows[0].nom : "Programme";

        const { rows: candidatureRows } = await pool.query(
          "SELECT nom_equipe FROM app_schema.candidatures WHERE id = $1",
          [candidatureId]
        );
        const candidatureNom = candidatureRows.length > 0 ? candidatureRows[0].nom_equipe : "Équipe";

        // Envoyer une notification de félicitations au gagnant
        // Récupérer tous les membres de l'équipe gagnante
        const membresCandidatureGagnante = await CandidatureMembre.getByCandidature(candidatureId);

        // Vérifier si c'est une équipe ou une startup individuelle
        const isTeam = membresCandidatureGagnante.length > 1;

        for (const membreId of membresCandidatureGagnante) {
          const soumission = await ProgrammeSoumission.checkSoumissionExists(membreId);
          if (soumission) {
            try {
              // Message différent selon qu'il s'agit d'une équipe ou d'une startup
              const message = isTeam
                ? `Félicitations ! Votre équipe "${candidatureNom}" a gagné le programme "${programmeName}".`
                : `Félicitations ! Votre startup "${candidatureNom}" a gagné le programme "${programmeName}".`;

              await Notification.create({
                user_id: soumission.utilisateur_id,
                user_role: 'startup',
                type: 'winner_announcement',
                title: 'Félicitations !',
                message: message,
                related_id: parseInt(programmeId),
                is_read: false
              });
              console.log(`Notification de félicitations créée pour ${isTeam ? "le membre d'équipe" : "la startup individuelle"} ${soumission.utilisateur_id}`);
            } catch (notifError) {
              console.error(`Erreur lors de la création de la notification pour ${isTeam ? "le membre d'équipe" : "la startup individuelle"} ${soumission.utilisateur_id}:`, notifError.message);
              // Continuer même si la création de notification échoue
            }
          }
        }

        // Envoyer des notifications à toutes les autres candidatures du programme
        // Récupérer toutes les candidatures du programme
        const { rows: toutesLesCandidatures } = await pool.query(
          "SELECT id, nom_equipe FROM app_schema.candidatures WHERE programme_id = $1 AND id != $2",
          [programmeId, candidatureId]
        );

        for (const autreCandidature of toutesLesCandidatures) {
          // Récupérer tous les membres de cette candidature
          const membresAutreCandidature = await CandidatureMembre.getByCandidature(autreCandidature.id);

          // Vérifier si cette candidature est une équipe ou une startup individuelle
          const isOtherTeam = membresAutreCandidature.length > 1;

          // Vérifier si le gagnant est une équipe ou une startup individuelle
          const isWinnerTeam = membresCandidatureGagnante.length > 1;

          for (const membreId of membresAutreCandidature) {
            const soumission = await ProgrammeSoumission.checkSoumissionExists(membreId);
            if (soumission) {
              try {
                // Adapter le message selon que le gagnant est une équipe ou une startup
                let message;
                if (isWinnerTeam) {
                  message = `L'équipe "${candidatureNom}" a été déclarée gagnante du programme "${programmeName}".`;
                } else {
                  message = `La startup "${candidatureNom}" a été déclarée gagnante du programme "${programmeName}".`;
                }

                await Notification.create({
                  user_id: soumission.utilisateur_id,
                  user_role: 'startup',
                  type: 'winner_announcement',
                  title: 'Annonce du gagnant',
                  message: message,
                  related_id: parseInt(programmeId),
                  is_read: false
                });
                console.log(`Notification d'annonce du gagnant créée pour ${isOtherTeam ? "le membre d'équipe" : "la startup individuelle"} ${soumission.utilisateur_id}`);
              } catch (notifError) {
                console.error(`Erreur lors de la création de la notification pour ${isOtherTeam ? "le membre d'équipe" : "la startup individuelle"} ${soumission.utilisateur_id}:`, notifError.message);
                // Continuer même si la création de notification échoue
              }
            }
          }
        }

        // Envoyer des notifications aux mentors du programme
        try {
          // Récupérer tous les mentors associés au programme
          const { rows: mentors } = await pool.query(
            `SELECT mentor_id
             FROM app_schema.programme_mentors
             WHERE programme_id = $1`,
            [programmeId]
          );

          // Message pour les mentors
          const mentorMessage = isTeam
            ? `L'équipe "${candidatureNom}" a été déclarée gagnante du programme "${programmeName}".`
            : `La startup "${candidatureNom}" a été déclarée gagnante du programme "${programmeName}".`;

          // Envoyer une notification à chaque mentor
          for (const mentor of mentors) {
            try {
              await Notification.create({
                user_id: mentor.mentor_id,
                user_role: 'mentor',
                type: 'winner_announcement',
                title: 'Annonce du gagnant',
                message: mentorMessage,
                related_id: parseInt(programmeId),
                is_read: false
              });
              console.log(`Notification d'annonce du gagnant créée pour le mentor ${mentor.mentor_id}`);
            } catch (mentorNotifError) {
              console.error(`Erreur lors de la création de la notification pour le mentor ${mentor.mentor_id}:`, mentorNotifError.message);
              // Continuer même si la création de notification échoue
            }
          }
        } catch (mentorsError) {
          console.error("Erreur lors de la récupération des mentors du programme:", mentorsError);
          // Continuer même si la récupération des mentors échoue
        }

        // Pas de notification pour l'administrateur car c'est lui qui annonce le gagnant

        res.status(200).json({
          message: "Gagnant enregistré !",
          phase: phaseMiseAJour,
          candidature_id: candidatureId
        });
      } else {
        return res.status(400).json({ error: "Cette phase n'a pas de gagnant" });
      }
    } catch (err) {
      console.error("Erreur :", err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Méthode pour obtenir le gagnant d'un programme
  async getProgrammeWinner(req, res) {
    try {
      const { programmeId } = req.params;

      if (!programmeId) {
        return res.status(400).json({ error: "ID de programme manquant" });
      }

      // Vérifier que le programme existe
      const { rows: programme } = await pool.query(
        "SELECT * FROM app_schema.programme WHERE id = $1",
        [programmeId]
      );

      if (programme.length === 0) {
        return res.status(404).json({ error: "Programme introuvable" });
      }

      // Obtenir le gagnant du programme (gagnant de la dernière phase) directement avec une requête SQL
      // pour éviter les problèmes potentiels avec la méthode du modèle
      const { rows: winners } = await pool.query(`
        SELECT
          c.id AS candidature_id,
          c.nom_equipe,
          c.type,
          p.nom AS phase_nom
        FROM app_schema.phase p
        JOIN app_schema.candidatures c ON p.gagnant_candidature_id = c.id
        WHERE p.programme_id = $1
        ORDER BY p.date_fin DESC
        LIMIT 1
      `, [programmeId]);

      if (winners.length === 0) {
        return res.status(404).json({ error: "Aucun gagnant trouvé pour ce programme" });
      }

      const winner = winners[0];

      // Vérifier si les tables nécessaires existent
      const { rows: tablesExist } = await pool.query(`
        SELECT
          (SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'app_schema'
            AND table_name = 'particuliers'
          )) as particuliers_exists,
          (SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'app_schema'
            AND table_name = 'utilisateur'
          )) as utilisateur_exists,
          (SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'app_schema'
            AND table_name = 'candidatures_membres'
          )) as candidatures_membres_exists
      `);

      let membres = [];

      if (tablesExist[0].particuliers_exists && tablesExist[0].utilisateur_exists && tablesExist[0].candidatures_membres_exists) {
        // Si la table particuliers existe, utiliser la requête complète
        const { rows: membresResult } = await pool.query(`
          SELECT
            cm.soumission_id,
            s.utilisateur_id,
            u.email,
            COALESCE(st.nom_entreprise, p.nom || ' ' || p.prenom) as nom_complet
          FROM app_schema.candidatures_membres cm
          JOIN app_schema.soumissions s ON cm.soumission_id = s.id
          JOIN app_schema.utilisateur u ON s.utilisateur_id = u.id
          LEFT JOIN app_schema.startups st ON u.id = st.utilisateur_id AND u.role = 'startup'
          LEFT JOIN app_schema.particuliers p ON u.id = p.utilisateur_id AND u.role = 'particulier'
          WHERE cm.candidatures_id = $1
        `, [winner.candidature_id]);
        membres = membresResult;
      } else if (tablesExist[0].candidatures_membres_exists) {
        // Si la table particuliers n'existe pas mais candidatures_membres existe
        const { rows: membresResult } = await pool.query(`
          SELECT
            cm.soumission_id,
            s.utilisateur_id,
            u.email,
            COALESCE(st.nom_entreprise, u.email) as nom_complet
          FROM app_schema.candidatures_membres cm
          JOIN app_schema.soumissions s ON cm.soumission_id = s.id
          JOIN app_schema.utilisateur u ON s.utilisateur_id = u.id
          LEFT JOIN app_schema.startups st ON u.id = st.utilisateur_id AND u.role = 'startup'
          WHERE cm.candidatures_id = $1
        `, [winner.candidature_id]);
        membres = membresResult;
      } else {
        // Si aucune des tables requises n'existe, retourner un tableau vide
        console.log("Tables requises manquantes, aucune information sur les membres ne sera retournée");
        membres = [];
      }

      // Ajouter les membres à l'objet gagnant
      winner.membres = membres;

      // Récupérer des informations sur le programme
      const { rows: programmeInfo } = await pool.query(`
        SELECT nom, description, date_debut, date_fin
        FROM app_schema.programme
        WHERE id = $1
      `, [programmeId]);

      if (programmeInfo.length > 0) {
        winner.programme = programmeInfo[0];
      }

      res.status(200).json(winner);
    } catch (err) {
      console.error("Erreur lors de la récupération du gagnant:", err);
      console.error("Détails de l'erreur:", err.stack);
      console.error("Programme ID:", req.params.programmeId);

      // Vérifier si la table candidatures existe et a les bonnes colonnes
      try {
        const { rows: tableInfo } = await pool.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'app_schema'
          AND table_name = 'candidatures'
        `);
        console.error("Structure de la table candidatures:", tableInfo);

        // Vérifier si la table phase existe et a les bonnes colonnes
        const { rows: phaseInfo } = await pool.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'app_schema'
          AND table_name = 'phase'
        `);
        console.error("Structure de la table phase:", phaseInfo);

        // Vérifier si la colonne gagnant_candidature_id existe dans la table phase
        const { rows: gagnantColInfo } = await pool.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'app_schema'
          AND table_name = 'phase'
          AND column_name = 'gagnant_candidature_id'
        `);
        console.error("Colonne gagnant_candidature_id existe:", gagnantColInfo.length > 0);

      } catch (dbErr) {
        console.error("Erreur lors de la vérification de la structure de la base de données:", dbErr);
      }

      res.status(500).json({
        error: 'Erreur serveur',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
};

