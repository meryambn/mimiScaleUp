import pool from '../../db.js';
import { Candidature } from '../models/candidature.js';
import { CandidatureMembre } from '../models/candidatureMembre.js';
import { ProgrammeSoumission } from '../models/programmeSoumission.js';
import { Notification } from '../models/notification.js';

export const CandidatureController = {
  // 1 ere methode creation d'une equipe(ensemble de startup et partculier ou un ensemble de particulier ou de startup seulement)
  async creerCandidature(req, res) {
    try {
      const { nom, description, programmeId, soumissionId } = req.body;
      //lazem aykon un tableau fe json (bach ne9dro on selection plusieurs startup wela particulier bach liywhom)
      if (!Array.isArray(soumissionId)) {
        return res.status(400).json({ error: 'soumissionId doit être un tableau.' });
      }

      // Vérifier que les soumissions ne sont pas déjà dans d'autres équipes
      //wela une startup wela particulier raho deja associer el une equipe tsma man9droch on lajoute el equipe wahdokhra
      for (const id of soumissionId) {
        const { rows } = await pool.query(
          "SELECT 1 FROM app_schema.candidatures_membres WHERE soumission_id = $1",
          [id]
        );
        //si on trouve
        if (rows.length > 0) {
          return res.status(400).json({
            error: `La soumission ${id} appartient déjà à une équipe`
          });
        }

        // verifier si la soumission existe
        const soumissionExiste = await ProgrammeSoumission.checkSoumissionExists(id);
        //si n'exesite pas
        if (!soumissionExiste) {
          return res.status(400).json({ error: `Soumission ${id} introuvable` });
        }
        //verifier si elle appartient cette soumission á un programme
        const appartientAuProgramme = await ProgrammeSoumission.checkSubmissionBelongsToProgram(id, programmeId);
        if (!appartientAuProgramme) {
          return res.status(400).json({ error: `La soumission ${id} ne correspond pas au programme ${programmeId}` });
        }
      }

       // Création de léquipe
      const nouvelleCandidature = await Candidature.create(nom, description, programmeId);
      const candidatureId = nouvelleCandidature.id;

      // Récupérer le nom du programme pour les notifications
      const { rows: programRows } = await pool.query(
        "SELECT nom FROM app_schema.programme WHERE id = $1",
        [programmeId]
      );
      const programmeName = programRows.length > 0 ? programRows[0].nom : "Programme";

       // Liaison des soumissions(startup,particulier) à l'équipe
      for (const id of soumissionId) {
        await CandidatureMembre.lierSoumission(candidatureId, id);

        const dejaDansProgramme = await ProgrammeSoumission.checkSoumissionInProgramme(programmeId, id);
        if (!dejaDansProgramme) {
          await ProgrammeSoumission.create(programmeId, id);
        }

        // Récupérer les informations de la soumission pour créer la notification
        const soumission = await ProgrammeSoumission.checkSoumissionExists(id);
        if (soumission) {
          try {
            // Créer une notification pour l'utilisateur
            await Notification.create({
              user_id: soumission.utilisateur_id,
              user_role: soumission.role,
              type: 'team_creation',
              title: 'Ajout à une équipe',
              message: `Vous avez été ajouté à l'équipe "${nom}" dans le programme "${programmeName}".`,
              related_id: candidatureId,
              is_read: false
            });
            console.log(`Notification créée pour l'utilisateur ${soumission.utilisateur_id} (${soumission.role})`);
          } catch (notifError) {
            console.error(`Erreur lors de la création de la notification pour l'utilisateur ${soumission.utilisateur_id}:`, notifError.message);
            // Continuer même si la création de notification échoue
          }
        }
      }
       // La fonctionnalité d'ajout automatique à la première phase a été désactivée
      // car le module candidaturePhase a été supprimé

      res.status(201).json({
        message: "Équipe créée et membres ajoutés au programme avec succès",
        candidature: nouvelleCandidature
      });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
      console.log("Erreur SQL:", err.message);
    }
  },

  async getequipe(req, res) {
    try {
      const { id } = req.params;

      // Récupérer les informations de l'équipe
      const { rows: equipeRows } = await pool.query(
        `SELECT c.id, c.nom_equipe as nom, c.description_equipe as description,
                c.programme_id, p.nom as programme_nom
         FROM app_schema.candidatures c
         LEFT JOIN app_schema.programme p ON c.programme_id = p.id
         WHERE c.id = $1`,
        [id]
      );

      if (equipeRows.length === 0) {
        return res.status(404).json({ error: 'Équipe non trouvée' });
      }

      const equipe = equipeRows[0];

      // Récupérer les membres de l'équipe
      const { rows: membresRows } = await pool.query(
        `SELECT cm.soumission_id as id, s.role, s.utilisateur_id,
                u.email, u.nom, u.prenom,
                st.nom_entreprise
         FROM app_schema.candidatures_membres cm
         JOIN app_schema.soumissions s ON cm.soumission_id = s.id
         JOIN app_schema.utilisateur u ON s.utilisateur_id = u.id
         LEFT JOIN app_schema.startups st ON u.id = st.utilisateur_id
         WHERE cm.candidatures_id = $1`,
        [id]
      );

      // Formater la réponse
      const response = {
        ...equipe,
        membres: membresRows.map(membre => ({
          id: membre.id,
          role: membre.role,
          utilisateur_id: membre.utilisateur_id,
          email: membre.email,
          nom: membre.role === 'startup' ? membre.nom_entreprise : `${membre.prenom} ${membre.nom}`
        }))
      };

      res.status(200).json(response);
    } catch(err) {
      console.log("Erreur SQL:", err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Récupérer les membres d'une équipe
  async getequipemembers(req, res) {
    try {
      const { id } = req.params;

      // Vérifier que l'équipe existe
      const { rows: equipeRows } = await pool.query(
        "SELECT 1 FROM app_schema.candidatures WHERE id = $1",
        [id]
      );

      if (equipeRows.length === 0) {
        return res.status(404).json({ error: 'Équipe non trouvée' });
      }

      // Récupérer les membres de l'équipe
      const { rows: membresRows } = await pool.query(
        `SELECT cm.soumission_id as id, s.role, s.utilisateur_id,
                u.email, u.nom, u.prenom,
                st.nom_entreprise
         FROM app_schema.candidatures_membres cm
         JOIN app_schema.soumissions s ON cm.soumission_id = s.id
         JOIN app_schema.utilisateur u ON s.utilisateur_id = u.id
         LEFT JOIN app_schema.startups st ON u.id = st.utilisateur_id
         WHERE cm.candidatures_id = $1`,
        [id]
      );

      // Formater la réponse
      const membres = membresRows.map(membre => ({
        id: membre.id,
        role: membre.role,
        utilisateur_id: membre.utilisateur_id,
        email: membre.email,
        nom: membre.role === 'startup' ? membre.nom_entreprise : `${membre.prenom} ${membre.nom}`
      }));

      res.status(200).json(membres);
    } catch(err) {
      console.log("Erreur SQL:", err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  async supprimerCandidature(req, res) {
  try {
    const { id } = req.params;

    // 1. Vérifier l'existence de la candidature
    const { rows: candidatureRows } = await pool.query(
      'SELECT c.*, p.nom as programme_nom FROM app_schema.candidatures c ' +
      'JOIN app_schema.programme p ON c.programme_id = p.id ' +
      'WHERE c.id = $1',
      [id]
    );
    if (candidatureRows.length === 0) {
      return res.status(404).json({ error: 'Candidature introuvable' });
    }

    const candidature = candidatureRows[0];
    const programmeName = candidature.programme_nom;

    // 2. Récupérer les soumissions associées avec les informations utilisateur
    const { rows: soumissionRows } = await pool.query(
      `SELECT cm.soumission_id, s.utilisateur_id, s.role
       FROM app_schema.candidatures_membres cm
       JOIN app_schema.soumissions s ON cm.soumission_id = s.id
       WHERE cm.candidatures_id = $1`,
      [id]
    );
    const soumissionIds = soumissionRows.map(row => row.soumission_id);

    // Envoyer des notifications aux membres avant de supprimer
    for (const membre of soumissionRows) {
      try {
        await Notification.create({
          user_id: membre.utilisateur_id,
          user_role: membre.role,
          type: 'candidature_removed',
          title: 'Retrait du programme',
          message: `Malheureusement vous étiez retiré du programme "${programmeName}". À la prochaine!`,
          related_id: candidature.programme_id,
          is_read: false
        });
        console.log(`Notification envoyée à l'utilisateur ${membre.utilisateur_id} (${membre.role})`);
      } catch (notifError) {
        console.error(`Erreur lors de la création de la notification pour l'utilisateur ${membre.utilisateur_id}:`, notifError.message);
        // Continuer même si la création de notification échoue
      }
    }

    // 3. Supprimer les soumissions et leurs dépendances (CASCADE)
    if (soumissionIds.length > 0) {
      await pool.query(
        'DELETE FROM app_schema.soumissions WHERE id = ANY($1)',
        [soumissionIds]
      );
    }

    // 4. Supprimer les autres dépendances
    await pool.query(
      'DELETE FROM app_schema.note WHERE candidature_id = $1',
      [id]
    );

    await pool.query(
      'DELETE FROM app_schema.candidatures_phases WHERE candidature_id = $1',
      [id]
    );

    // 5. Supprimer la candidature elle-même
    await pool.query(
      'DELETE FROM app_schema.candidatures WHERE id = $1',
      [id]
    );

    res.status(200).json({ message: 'Candidature et membres supprimés avec succès' });

  } catch (err) {
    console.error("Erreur lors de la suppression:", err.message);
    res.status(500).json({
      error: 'Erreur serveur',
      details: err.message
    });
  }
}

}

/*import pool from '../../db.js';
import { Candidature } from '../models/candidature.js';
import { CandidatureMembre } from '../models/candidatureMembre.js';
import { ProgrammeSoumission } from '../models/programmeSoumission.js';

export const CandidatureController = {
  // Creer des candidature
  async creerCandidature(req, res) {
    try {
      const { nom, description, programmeId, soumissionId } = req.body;
      console.log("soumissionId reçu :", soumissionId);

      // Validation du format des soumissions
      if (!Array.isArray(soumissionId)) {
        return res.status(400).json({ error: 'soumissionId doit être un tableau.' });
      }

      // Vérifier toutes les soumissions avant de continuer
      for (const id of soumissionId) {
        // Vérifier que la soumission existe
        const soumissionExiste = await ProgrammeSoumission.checkSoumissionExists(id);
        if (!soumissionExiste) {
          return res.status(400).json({ error: `Soumission ${id} introuvable` });
        }

        // Vérifier que la soumission appartient au programme
        const appartientAuProgramme = await ProgrammeSoumission.checkSubmissionBelongsToProgram(id, programmeId);
        if (!appartientAuProgramme) {
          return res.status(400).json({ error: `La soumission ${id} ne correspond pas au programme ${programmeId}` });
        }
      }

      // Création du nom + description d'une équipe
      const nouvelleCandidature = await Candidature.create(nom, description, programmeId);
      const candidatureId = nouvelleCandidature.id;

      // Lier les soumissions à l'équipe et les ajouter au programme si nécessaire
      for (const id of soumissionId) {
        // Liaison des soumissions à l'équipe
        await CandidatureMembre.lierSoumission(candidatureId, id);

        // Vérifier si la soumission est déjà dans le programme
        const dejaDansProgramme = await ProgrammeSoumission.checkSoumissionInProgramme(programmeId, id);
        if (!dejaDansProgramme) {
          // Ajout de chaque membre au programme
          await ProgrammeSoumission.create(programmeId, id);
        }
      }

      res.status(201).json({
        message: "Équipe créée et membres ajoutés au programme avec succès",
        candidature: nouvelleCandidature
      });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
      console.log("Erreur SQL:", err.message);
    }
  },
 async getCandidature(req, res) {


 }


}*/


  /* Lier une soumission à une équipe
   async lierSoumission(req, res) {
  try {
    const { candidatureId } = req.params;
    const { soumissionIds } = req.body; // Reçoit un tableau
    for (const soumissionId of soumissionIds) {
      await CandidatureMembre.lierSoumission(candidatureId, soumissionId);
    }
    res.status(200).json({ message: "Soumissions ajoutées avec succès" });
  } catch (error) {res.status(500).json({ error: 'Erreur serveur' });
            console.log("Erreur SQL:", err.message);}
}}*/
/*
export const CandidatureController = {
  async creerCandidature(req, res) {
    try {
      const { nom, description, programmeId, soumissionId } = req.body;

      if (!Array.isArray(soumissionId)) {
        return res.status(400).json({ error: "soumissionId doit être un tableau." });
      }

      // 1. Récupérer la taille max du programme
      const programmeQuery = await pool.query(
        "SELECT taille_equipe_max FROM app_schema.programme WHERE id = $1",
        [programmeId]
      );
      if (programmeQuery.rows.length === 0) {
        return res.status(404).json({ error: "Programme non trouvé." });
      }
      const tailleMax = programmeQuery.rows[0].taille_equipe_max;

      // 2. Calculer le total des membres (startups + particuliers)
      let totalMembres = 0;
      for (const id of soumissionId) {
        // Vérifier que la soumission n'est PAS une équipe
        const isEquipe = await pool.query(
          "SELECT 1 FROM app_schema.candidatures WHERE id = $1",
          [id]
        );
        if (isEquipe.rows.length > 0) {
          return res.status(400).json({
            error: `soumissionId ${id} est une équipe. Interdit.`
          });
        }

        // Traiter comme une soumission normale
        const soumission = await pool.query(
          `SELECT s.nombre_employes, soum.role
           FROM app_schema.soumissions soum
           LEFT JOIN app_schema.startups s ON soum.utilisateur_id = s.utilisateur_id
           WHERE soum.id = $1`,
          [id]
        );
        if (soumission.rows.length === 0) {
          return res.status(400).json({ error: `Soumission ID ${id} invalide.` });
        }
        const { nombre_employes, role } = soumission.rows[0];
        totalMembres += role === 'startup' ? Number(nombre_employes) : 1;
      }

      // 3. Vérifier la limite
      if (totalMembres > tailleMax) {
        return res.status(400).json({
          error: `Taille maximale (${tailleMax}) dépassée. Membres: ${totalMembres}`
        });
      }

      // 4. Créer la candidature
      const nouvelleCandidature = await Candidature.create(nom, description, programmeId);

      // 5. Lier les soumissions
      for (const id of soumissionId) {
        await CandidatureMembre.lierSoumission(nouvelleCandidature.id, id);
      }

      res.status(201).json({
        message: "Candidature créée avec succès",
        candidature: nouvelleCandidature
      });

    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
      console.error("Erreur détaillée:", err.message);
    }
  },
};*/