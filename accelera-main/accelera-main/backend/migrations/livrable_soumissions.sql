-- Table pour stocker les soumissions de livrables
CREATE TABLE IF NOT EXISTS app_schema.livrable_soumissions (
    id SERIAL PRIMARY KEY,
    livrable_id INTEGER NOT NULL REFERENCES app_schema.livrables(id) ON DELETE CASCADE,
    candidature_id INTEGER NOT NULL REFERENCES app_schema.candidatures(id) ON DELETE CASCADE,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier TEXT NOT NULL,
    date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(50) DEFAULT 'en attente' NOT NULL, -- Valeurs possibles: 'en attente', 'valide', 'rejete'
    UNIQUE(livrable_id, candidature_id) -- Une équipe ne peut soumettre qu'une fois par livrable
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_livrable_soumissions_livrable ON app_schema.livrable_soumissions(livrable_id);
CREATE INDEX IF NOT EXISTS idx_livrable_soumissions_candidature ON app_schema.livrable_soumissions(candidature_id);
