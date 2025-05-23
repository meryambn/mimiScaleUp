import pool from '../../db.js';
import { Note } from '../models/note.js';
import { critere } from '../models/critere.js';

export const noteController = {
    // Soumettre des réponses pour une candidature
    async submitResponses(req, res) {
        try {
            const { candidature_id, reponses } = req.body;

        for (const reponse of reponses) {
                // Vérifier si le critère existe
                const critereData = await critere.getById(reponse.critere_id);
                if (!critereData) {
                    return res.status(404).json({ 
                        error: `Critère ${reponse.critere_id} non trouvé` 
                    });
                }
                // Nouvelle condition : vérifier l'accès équipe
                if (!critereData.accessible_equipes) {
                    return res.status(403).json({ 
                        error: `Action interdite : critère ${reponse.critere_id} non accessible aux équipes`
                    });
                }
// NOUVELLE VÉRIFICATION 3 : Destinataire autorisé
            if (critereData.rempli_par !== 'equipes') {
                return res.status(403).json({
                    error: `Action interdite : critère ${reponse.critere_id} réservé aux ${critereData.rempli_par}`
                });
            }
                // Éviter les doublons
                if (await Note.exists(candidature_id, reponse.critere_id)) {
                    return res.status(400).json({ 
                        error: `Réponse déjà existante pour le critère ${reponse.critere_id}`
                    });
                }

                // Enregistrer la réponse
                await Note.create(candidature_id, reponse.critere_id, reponse.valeur);
            }

            res.status(201).json({ 
                message: "Réponses enregistrées avec succès" 
            });

        } catch (err) {
            console.error("Erreur:", err);
            res.status(500).json({ 
                error: "Erreur serveur",
                details: err.message 
            });
        }
    },
    // 2eme methode ta3 afficher les reponses des equipes dun critere devaluation (ki aykon accesible par equipe+ lequipe 3ndha le drout de remplir )
async getReponsesCandidaturePhase(req, res) {
    try {
        const { candidatureId, phaseId } = req.params;

        // Récupérer les réponses
        const reponses = await Note.getReponsesByCandidatureAndPhase(candidatureId, phaseId);

        if (reponses.length === 0) {
            return res.status(404).json({ 
                message: "Aucune réponse trouvée pour cette candidature et phase" 
            });
        }

        res.status(200).json(reponses);

    } catch (err) {
        console.error("Erreur:", err);
        res.status(500).json({ 
            error: "Erreur serveur",
            details: err.message 
        });
    }
},
/*3eme methode pour enregistrer les reponses  du mentor
async submitMentorResponses(req, res) {
    try {
        const { candidature_id,mentor_id, reponses } = req.body;
         
        // Récupérer le programme associé à la candidature
        const candidatureQuery = await pool.query(
            'SELECT programme_id FROM app_schema.candidatures WHERE id = $1',
            [candidature_id]
        );
        if (!candidatureQuery.rows[0]) {
            return res.status(404).json({ error: "Candidature non trouvée" });
        }
        const programme_id = candidatureQuery.rows[0].programme_id;

        // Vérifier si le mentor fait partie du programme
        const mentorCheck = await pool.query(
            `SELECT 1 FROM app_schema.programme_mentors 
             WHERE programme_id = $1 AND mentor_id = $2`,
            [programme_id, mentor_id]
        );
        if (mentorCheck.rows.length === 0) {
            return res.status(403).json({ 
                error: "Mentor non autorisé pour ce programme" 
            });
        }

        for (const reponse of reponses) {
            const critereData = await critere.getById(reponse.critere_id);
            if (!critereData) {
                return res.status(404).json({ 
                    error: `Critère ${reponse.critere_id} non trouvé` 
                });
            }


            // Vérifier le destinataire autorisé
            if (critereData.rempli_par !== 'mentors') {
                return res.status(403).json({
                    error: `Action interdite : critère ${reponse.critere_id} réservé aux ${critereData.rempli_par}`
                });
            }

            // Éviter les doublons
            if (await Note.exists(candidature_id, reponse.critere_id)) {
                return res.status(400).json({ 
                    error: `Réponse déjà existante pour le critère ${reponse.critere_id}`
                });
            }

            // Enregistrer la réponse
            await Note.create(candidature_id, reponse.critere_id, reponse.valeur);
        }

        res.status(201).json({ 
            message: "Réponses enregistrées avec succès" 
        });

    } catch (err) {
        console.error("Erreur:", err);
        res.status(500).json({ 
            error: "Erreur serveur",
            details: err.message 
        });
    }
},*/

//methode 4  pour valide une reponse dune equipe á un critere si pas valide -->donc donner la main á un mentor pour le modifier 
async validerOuModifierReponseEquipe(req, res) {
    try {
        const { candidature_id, mentor_id, reponses } = req.body;

        // Vérification candidature
        const { rows: [candidature] } = await pool.query(
            'SELECT programme_id FROM app_schema.candidatures WHERE id = $1',
            [candidature_id]
        );
        if (!candidature) return res.status(404).json({ error: "Candidature non trouvée" });

        // Vérification mentor
        const { rows: mentorOK } = await pool.query(
            'SELECT 1 FROM app_schema.programme_mentors WHERE programme_id = $1 AND mentor_id = $2',
            [candidature.programme_id, mentor_id]
        );
        if (!mentorOK.length) return res.status(403).json({ error: "Mentor non autorisé" });

        const resultats = [];
        
        // Traitement par lot
        for (const { critere_id, nouvelle_valeur } of reponses) {
            // Vérification critère
            const critereData = await critere.getById(critere_id);
            if (!critereData || critereData.rempli_par !== 'equipes') {
                return res.status(403).json({ error: `Critère ${critere_id} non modifiable` });
            }

            // Récupération réponse existante
            const { rows: [reponse] } = await pool.query(
                'SELECT * FROM app_schema.note WHERE candidature_id = $1 AND critere_id = $2',
                [candidature_id, critere_id]
            );
            if (!reponse) return res.status(404).json({ error: `Réponse ${critere_id} non trouvée` });
            if (reponse.valide) return res.status(403).json({ error: `Réponse ${critere_id} déjà validée` });

            // Mise à jour
            const valeurFinale = nouvelle_valeur ?? reponse.valeur;
            const { rows: [updated] } = await pool.query(
                'UPDATE app_schema.note SET valeur = $1, valide = TRUE, valide_par_mentor_id = $2 ' +
                'WHERE candidature_id = $3 AND critere_id = $4 RETURNING *',
                [valeurFinale, mentor_id, candidature_id, critere_id]
            );
            
            resultats.push(updated);
        }

        res.status(200).json(resultats);

    } catch (err) {
        console.error("Erreur validation multiple :", err);
        res.status(500).json({ error: "Erreur serveur", details: err.message });
    }
},

async getReponsesValides(req, res) {
    try {
        const { candidature_id, phaseId } = req.params;
        
        const { rows } = await pool.query(`
            SELECT 
                n.id,
                c.id AS critere_id,
                n.valeur,
                c.nom_critere,
                c.type,
                c.poids,
                p.nom AS phase_nom,
                m.nom AS mentor_nom,
                m.prenom AS mentor_prenom
            FROM app_schema.note n
            JOIN app_schema.criteresdevaluation c 
                ON n.critere_id = c.id
            JOIN app_schema.phase p 
                ON c.phase_id = p.id
            LEFT JOIN app_schema.mentors m 
                ON n.valide_par_mentor_id = m.utilisateur_id
            WHERE 
                n.candidature_id = $1 
                AND c.phase_id = $2 
                AND n.valide = TRUE
            
        `, [candidature_id, phaseId]);

        if (rows.length === 0) {
            return res.status(404).json({ 
                message: `Aucune réponse validée trouvée pour la phase ${phaseId}`
            });
        }

        const resultatFormate = rows.map(row => ({
            critere: {
               id: row.critere_id,
                nom: row.nom_critere,
                type: row.type,
                poids: row.poids
            },
            phase: row.phase_nom,
            valeur: row.valeur,
            validation: {
                date: row.date_modification,
                mentor: row.mentor_nom 
                    ? `${row.mentor_prenom} ${row.mentor_nom}`
                    : "Non spécifié"
            }
        }));

        res.status(200).json(resultatFormate);
    } catch (err) {
        console.error("Erreur récupération réponses validées :", err);
        res.status(500).json({ 
            error: "Erreur serveur",
            details: err.message 
        });
    }
},

async getToutesReponsesMentor(req, res) {
  try {
    const { mentor_id, candidature_id, phase_id } = req.params;

    const result = await pool.query(`
      SELECT 
        n.id AS note_id,
        n.critere_id,
        n.valeur,
        c.nom_critere,
        c.rempli_par,
        c.type,
        c.poids,
        n.valide,
        ph.nom AS phase_nom,
        COALESCE(m_rempli.nom || ' ' || m_rempli.prenom, 'Équipe') AS rempli_par,
        COALESCE(m_valide.nom || ' ' || m_valide.prenom, 'Non validé') AS valide_par
      FROM app_schema.note n
      JOIN app_schema.criteresdevaluation c ON n.critere_id = c.id
      JOIN app_schema.phase ph ON c.phase_id = ph.id
      LEFT JOIN app_schema.mentors m_rempli ON n.rempli_par_mentor_id = m_rempli.utilisateur_id
      LEFT JOIN app_schema.mentors m_valide ON n.valide_par_mentor_id = m_valide.utilisateur_id
      WHERE 
        n.candidature_id = $1
        AND c.phase_id = $2
        AND (
          (c.rempli_par = 'mentors' AND n.rempli_par_mentor_id = $3)
          OR
          (c.rempli_par = 'equipes' AND n.valide_par_mentor_id = $3)
        )
      ORDER BY c.rempli_par DESC
    `, [candidature_id, phase_id, mentor_id]);

    const reponsesFormatees = result.rows.map(row => ({
      id: row.note_id,
      critere: {
        id: row.critere_id,
        nom: row.nom_critere,
        type: row.type,
        poids: row.poids
      },
      phase: row.phase_nom,
      valeur: row.valeur,
      remplissage: {
        par: row.rempli_par,
        type: row.rempli_par === 'Équipe' ? 'equipes' : 'mentors'
      },
      validation: {
        statut: row.valide ? 'Validée' : 'En attente',
        par: row.valide_par // Plus de date ici
      }
    }));

    res.status(200).json(reponsesFormatees);

  } catch (err) {
    console.error("Erreur récupération réponses mentor :", err);
    res.status(500).json({ 
      error: "Erreur serveur",
      details: err.message 
    });
  }
},
async getToutesReponsesTousMentors(req, res) {
  try {
    const { candidature_id, phase_id } = req.params;

    const result = await pool.query(`
      SELECT 
        n.id AS note_id,
        c.nom_critere,
        n.valide,
        COALESCE(m_valide.nom, m_programme.nom) AS mentor_nom,
        COALESCE(m_valide.prenom, m_programme.prenom) AS mentor_prenom,
        COALESCE(n.valide_par_mentor_id, pm.mentor_id) AS mentor_id,
        n.valeur
      FROM app_schema.note n
      JOIN app_schema.criteresdevaluation c 
        ON n.critere_id = c.id
      LEFT JOIN app_schema.mentors m_valide 
        ON m_valide.utilisateur_id = n.valide_par_mentor_id
      LEFT JOIN app_schema.programme_mentors pm 
        ON pm.programme_id = (
          SELECT programme_id 
          FROM app_schema.candidatures 
          WHERE id = $1
        )
      LEFT JOIN app_schema.mentors m_programme 
        ON m_programme.utilisateur_id = pm.mentor_id
      WHERE n.candidature_id = $1
        AND c.phase_id = $2
        AND (
            c.rempli_par = 'mentors'
            OR (c.rempli_par = 'equipes' AND n.valide = true)
        )
    `, [candidature_id, phase_id]);
    res.status(200).json(result.rows);

  } catch (err) {
    console.error("Erreur récupération toutes réponses :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
},
async getMentorsQuiOntReponduPourPhaseEtCandidature(req, res) {
  try {
    const { phase_id, candidature_id } = req.params;

    const result = await pool.query(`
      SELECT 
        m.utilisateur_id AS mentor_id,
        m.nom AS mentor_nom,
        m.prenom AS mentor_prenom,
        c.id AS critere_id,
        c.nom_critere,
        c.rempli_par,
        c.type,
        c.poids,
        n.valeur,
        n.valide,
        CASE 
          WHEN c.rempli_par = 'mentors' THEN 'remplie'
          WHEN c.rempli_par = 'equipes' THEN 'validee'
          ELSE 'inconnue'
        END AS source
      FROM app_schema.note n
      JOIN app_schema.criteresdevaluation c ON c.id = n.critere_id
      JOIN app_schema.mentors m ON m.utilisateur_id = n.valide_par_mentor_id
      WHERE c.phase_id = $1
        AND n.candidature_id = $2
        AND (
          c.rempli_par = 'mentors'
          OR (c.rempli_par = 'equipes' AND n.valide = true)
        )
      ORDER BY m.utilisateur_id, c.id
    `, [phase_id, candidature_id]);

    const mentors = {};

    for (const row of result.rows) {
      const id = row.mentor_id;
      if (!mentors[id]) {
        mentors[id] = {
          mentor_id: id,
          mentor_nom: row.mentor_nom,
          mentor_prenom: row.mentor_prenom,
          reponses: []
        };
      }

      mentors[id].reponses.push({
        critere_id: row.critere_id,
        nom_critere: row.nom_critere,
        rempli_par: row.rempli_par,
        type: row.type,
        poids: row.poids,
        source: row.source
      });
    }

    res.status(200).json(Object.values(mentors));

  } catch (err) {
    console.error("Erreur mentors actifs phase + candidature :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
},

//djedida
async submitMentorResponses(req, res) {
  try {
    const { candidature_id, mentor_id, reponses } = req.body;

    // 1. Vérifier que la candidature existe et récupérer le programme
    const candidatureQuery = await pool.query(
      'SELECT programme_id FROM app_schema.candidatures WHERE id = $1',
      [candidature_id]
    );

    if (!candidatureQuery.rows[0]) {
      return res.status(404).json({ error: "Candidature non trouvée" });
    }

    const programme_id = candidatureQuery.rows[0].programme_id;

    // 2. Vérifier que le mentor fait partie du programme
    const mentorCheck = await pool.query(
      `SELECT 1 FROM app_schema.programme_mentors 
       WHERE programme_id = $1 AND mentor_id = $2`,
      [programme_id, mentor_id]
    );

    if (mentorCheck.rows.length === 0) {
      return res.status(403).json({
        error: "Mentor non autorisé pour ce programme"
      });
    }

    // 3. Enregistrer chaque réponse
    for (const reponse of reponses) {
      const critereData = await critere.getById(reponse.critere_id);

      if (!critereData) {
        return res.status(404).json({
          error: `Critère ${reponse.critere_id} non trouvé`
        });
      }

      if (critereData.rempli_par !== 'mentors') {
        return res.status(403).json({
          error: `Action interdite : critère ${reponse.critere_id} réservé aux ${critereData.rempli_par}`
        });
      }

      const alreadyExists = await Note.exists(candidature_id, reponse.critere_id);
      if (alreadyExists) {
        return res.status(400).json({
          error: `Réponse déjà existante pour le critère ${reponse.critere_id}`
        });
      }

      // 4. Insérer la note en précisant le mentor qui l’a remplie
      await Note.create(candidature_id, reponse.critere_id, reponse.valeur, mentor_id);
    }

    res.status(201).json({
      message: "Réponses enregistrées avec succès"
    });

  } catch (err) {
    console.error("Erreur submitMentorResponses:", err);
    res.status(500).json({
      error: "Erreur serveur",
      details: err.message
    });
  }
},

async getMentorsFilledOnly(req, res) {
  try {
    const { phase_id, candidature_id } = req.params;

    const result = await pool.query(`
      SELECT 
        m.utilisateur_id AS mentor_id,
        m.nom AS mentor_nom,
        m.prenom AS mentor_prenom,
        c.id AS critere_id,
        c.nom_critere,
        c.type,
        c.poids,
        n.valeur,
        n.valide
      FROM app_schema.note n
      JOIN app_schema.criteresdevaluation c ON c.id = n.critere_id
      JOIN app_schema.phase ph ON ph.id = c.phase_id
      JOIN app_schema.programme_mentors pm 
        ON pm.mentor_id = n.rempli_par_mentor_id AND pm.programme_id = ph.programme_id
      JOIN app_schema.mentors m ON m.utilisateur_id = pm.mentor_id
      WHERE c.phase_id = $1
        AND n.candidature_id = $2
        AND c.rempli_par = 'mentors'
        AND n.rempli_par_mentor_id IS NOT NULL
      ORDER BY m.utilisateur_id, c.id;
    `, [phase_id, candidature_id]);

    const mentors = {};

    for (const row of result.rows) {
      const id = row.mentor_id;
      if (!mentors[id]) {
        mentors[id] = {
          mentor_id: id,
          mentor_nom: row.mentor_nom,
          mentor_prenom: row.mentor_prenom,
          reponses: []
        };
      }

      mentors[id].reponses.push({
        critere_id: row.critere_id,
        nom_critere: row.nom_critere,
        type: row.type,
        poids: row.poids,
        valeur: row.valeur,
        valide: row.valide
      });
    }

    res.status(200).json(Object.values(mentors));
  } catch (err) {
    console.error("Erreur récupération réponses mentors (remplis) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
},

async getToutesReponsesMentors(req, res) {
  try {
    const { candidature_id, phase_id } = req.params;

    const result = await pool.query(`
      SELECT 
        n.id AS note_id,
        n.critere_id,
        n.valeur,
        c.nom_critere,
        c.type,
        c.poids,
        ph.nom AS phase_nom,
        -- Mentor ayant rempli
        COALESCE(m_rempli.nom || ' ' || m_rempli.prenom, 'Non spécifié') AS rempli_par,
        -- Mentor ayant validé
        COALESCE(m_valide.nom || ' ' || m_valide.prenom, 'Non validé') AS valide_par
      FROM app_schema.note n
      JOIN app_schema.criteresdevaluation c 
        ON n.critere_id = c.id
      JOIN app_schema.phase ph 
        ON c.phase_id = ph.id
      LEFT JOIN app_schema.mentors m_rempli 
        ON n.rempli_par_mentor_id = m_rempli.utilisateur_id
      LEFT JOIN app_schema.mentors m_valide 
        ON n.valide_par_mentor_id = m_valide.utilisateur_id
      WHERE 
        n.candidature_id = $1
        AND c.phase_id = $2
        AND (
          -- Critères remplis par des mentors
          (c.rempli_par = 'mentors') 
          OR 
          -- Critères validés par des mentors
          (c.rempli_par = 'equipes' AND n.valide_par_mentor_id IS NOT NULL)
        )
      ORDER BY c.rempli_par DESC, m_rempli.nom
    `, [candidature_id, phase_id]);

    const reponsesFormatees = result.rows.map(row => ({
      id: row.note_id,
      critere: {
        id: row.critere_id,
        nom: row.nom_critere,
        type: row.type,
        poids: row.poids
      },
      phase: row.phase_nom,
      valeur: row.valeur,
      rempli_par: row.rempli_par,
      valide_par: row.valide_par
    }));

    res.status(200).json(reponsesFormatees);

  } catch (err) {
    console.error("Erreur récupération réponses :", err);
    res.status(500).json({ 
      error: "Erreur serveur",
      details: err.message 
    });
  }
},
async getReponsesMentorsPourEquipe(req, res) {
  try {
    const { candidature_id, phase_id } = req.params;

    const result = await pool.query(`
      SELECT 
        n.id AS note_id,
        n.critere_id,
        c.nom_critere,
        c.type,
        c.poids,
        n.valeur,
        ph.nom AS phase_nom,
        -- Source de la réponse
        CASE 
          WHEN c.rempli_par = 'mentors' THEN 'Rempli par mentor'
          ELSE 'Modifié par mentor' 
        END AS source,
        -- Détails du mentor
        COALESCE(m.nom || ' ' || m.prenom, 'Système') AS mentor
      FROM app_schema.note n
      JOIN app_schema.criteresdevaluation c 
        ON n.critere_id = c.id
      JOIN app_schema.phase ph 
        ON c.phase_id = ph.id
      LEFT JOIN app_schema.mentors m 
        ON n.valide_par_mentor_id = m.utilisateur_id
      WHERE 
        n.candidature_id = $1
        AND c.phase_id = $2
        AND (
          -- Critères remplis directement par les mentors
          (c.rempli_par = 'mentors' AND c.accessible_equipes = true)
          OR
          -- Critères équipe modifiés/validés par les mentors
          (c.rempli_par = 'equipes' AND n.valide_par_mentor_id IS NOT NULL)
        )
      ORDER BY c.rempli_par DESC, c.nom_critere
    `, [candidature_id, phase_id]);

    const reponsesFormatees = result.rows.map(row => ({
      id: row.note_id,
      critere: {
        id: row.critere_id,
        nom: row.nom_critere,
        type: row.type,
        poids: row.poids
      },
      phase: row.phase_nom,
      valeur: row.valeur,
      source: row.source,
      mentor: row.mentor
    }));

    res.status(200).json(reponsesFormatees);

  } catch (err) {
    console.error("Erreur récupération réponses mentors :", err);
    res.status(500).json({ 
      error: "Erreur serveur",
      details: err.message 
    });
  }
},
async getReponsesMentorsPourEquipes(req, res) {
  try {
    const { candidature_id, phase_id } = req.params;

    const result = await pool.query(`
      SELECT 
        n.id AS note_id,
        n.critere_id,
        c.nom_critere,
        c.type,
        c.poids,
        n.valeur,
        ph.nom AS phase_nom,
        -- Source de la réponse
        CASE 
          WHEN c.rempli_par = 'mentors' THEN 'Rempli par mentor'
          ELSE 'Modifié par mentor' 
        END AS source,
        -- Détails du mentor
        COALESCE(m.nom || ' ' || m.prenom, 'Système') AS mentor
      FROM app_schema.note n
      JOIN app_schema.criteresdevaluation c 
        ON n.critere_id = c.id
      JOIN app_schema.phase ph 
        ON c.phase_id = ph.id
      LEFT JOIN app_schema.mentors m 
        ON n.valide_par_mentor_id = m.utilisateur_id
      WHERE 
        n.candidature_id = $1
        AND c.phase_id = $2
        AND (
          -- Critères remplis directement par les mentors
          (c.rempli_par = 'mentors' AND c.accessible_equipes = true)
          OR
          -- Critères équipe modifiés/validés par les mentors
          (c.rempli_par = 'equipes' AND n.valide_par_mentor_id IS NOT NULL)
        )
      ORDER BY c.rempli_par DESC, c.nom_critere
    `, [candidature_id, phase_id]);

    const reponsesFormatees = result.rows.map(row => ({
      id: row.note_id,
      critere: {
        id: row.critere_id,
        nom: row.nom_critere,
        type: row.type,
        poids: row.poids
      },
      phase: row.phase_nom,
      valeur: row.valeur,
      source: row.source,
      mentor: row.mentor
    }));

    res.status(200).json(reponsesFormatees);

  } catch (err) {
    console.error("Erreur récupération réponses mentors :", err);
    res.status(500).json({ 
      error: "Erreur serveur",
      details: err.message 
    });
  }
},
}