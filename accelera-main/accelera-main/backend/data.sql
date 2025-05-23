-- 1. Créer la base de données 
CREATE DATABASE accelera;
--cnx á ma base de données accelera:
psql -U postgres -d accelera -h localhost -p 5432
--2.creation d'un schema
CREATE SCHEMA "app_schema";
--permet de creer des tables dans le schema I_NOTE--
SET SEARCH_PATH = "app_schema";
-- 2. Créer le type ENUM pour les rôles
CREATE TYPE app_schema.role_utilisateur AS ENUM ('startup', 'mentor', 'particulier');
ALTER TYPE app_schema.role_utilisateur ADD VALUE 'admin';
-- 3. Table utilisateurs (parente)
--La clé étrangère lie chaque table fille (startups, mentors, etc.) à la table parente utilisateurs--
CREATE TABLE app_schema.utilisateur(
    id SERIAL,-- le type SERIAL signifie que la valeur de la colonne est générée automatiquement par la base de données.
    email VARCHAR(255) UNIQUE NOT NULL,
   motDePasse  VARCHAR(255) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    role app_schema.role_utilisateur NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,--écrit la date et l'heure exacte quand vous ajoutez une nouvelle ligne dans table.
    PRIMARY KEY (id, role) -- Clé primaire composite
);
--4.table startups (enfant):
--FOREIGN KEY permet de créer une liaison logique entre la table parente (utilisateurs) et les tables enfants-- 
CREATE TABLE app_schema.startups (
    utilisateur_id INT PRIMARY KEY,
    role app_schema.role_utilisateur NOT NULL DEFAULT 'startup' CHECK (role = 'startup'),
    nom_entreprise VARCHAR(255) NOT NULL,
    site_web VARCHAR(255),
    annee_creation INT,
    nombre_employes INT,
    fichier_entreprise VARCHAR(255),
    FOREIGN KEY (utilisateur_id, role) --Lie la table enfant à utilisateurs via id + role.
        REFERENCES app_schema.utilisateur(id, role) ON DELETE CASCADE --Si une ligne de utilisateurs est supprimée, toutes les lignes enfant  avec le même (id, role) sont automatiquement supprimées.

);

-- 4. Table mentors (enfant):
CREATE TABLE app_schema.mentors (
    utilisateur_id INT PRIMARY KEY,
    role app_schema.role_utilisateur NOT NULL DEFAULT 'mentor' CHECK (role = 'mentor'),
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    profession VARCHAR(100),
    FOREIGN KEY (utilisateur_id, role) 
        REFERENCES app_schema.utilisateur(id, role) ON DELETE CASCADE
);

-- 5. Table particuliers (enfant):
CREATE TABLE app_schema.particuliers (
    utilisateur_id INT PRIMARY KEY,
    role app_schema.role_utilisateur NOT NULL DEFAULT 'particulier' CHECK (role = 'particulier'),
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    FOREIGN KEY (utilisateur_id, role) 
        REFERENCES app_schema.utilisateur(id, role) ON DELETE CASCADE
);

-- Creer des nouveaux type pour la colonne stage  de la startup
 CREATE TYPE app_schema.stageStartup as enum ('Idéation','Pré-MVP','MVP', 'Growth', 'Scaling');
-- Ajouter la colonne stage avec le type app_schema.stageStartup (qui contient les types de stage)dans la table startups 
 alter table app_schema.startups add column stage app_schema.stageStartup NOT NULL default 'Idéation';
 -- creer table equipe
 CREATE TABLE app_schema.equipe(
    id serial PRIMARY KEY,
    matricule int,
    nom varchar(255) not null,
    prenom  varchar(255) not null,
    startup_id int not null, 
 --Chaque membre est associé à une startup via startup_id
    FOREIGN KEY (startup_id) REFERENCES app_schema.startups(utilisateur_id) ON DELETE CASCADE
 )
 -- creation de type de programme deja definies:
 CREATE TYPE app_schema.type_programme AS ENUM (
    'Accélération',
    'Incubation',
    'Hackathon',
    'Défi d''innovation',
    'Personnalisé' -- Cas spécial sans modèle prédéfini
);
-- creation de type qui des phases requises :
CREATE TYPE app_schema.phase_type AS ENUM (
    'Pre-seed', 
    'Seed', 
    'Series A', 
    'Series B', 
    'Growth'
);
-- creation de type qui des industries requises  :
CREATE TYPE app_schema.industrie_type AS ENUM (
    'Technology', 
    'Healthcare', 
    'Fintech', 
    'Social Impact', 
    'Education', 
    'Other'
);
-- creation de type qui des documents requises :
CREATE TYPE app_schema.document_type AS ENUM (
    'Pitch Deck', 
    'Financial Projections', 
    'Team Bios', 
    'Business Plan'
);

-- Table des programmes
CREATE TABLE app_schema.programme (
    id SERIAL PRIMARY KEY,
    type type_programme NOT NULL, 
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
     phases_requises phase_type[]DEFAULT '{}',  -- Tableau de phases (choix multiples)
    industries_requises industrie_type[]DEFAULT '{}',    -- Tableau d'industries
    documents_requis document_type[]DEFAULT '{}',   ,  
    taille_equipe_min INT DEFAULT 1,,
    taille_equipe_max INT DEFAULT 8,
    ca_min NUMERIC DEFAULT 0,
    ca_max NUMERIC DEFAULT 100000,
      admin_id INT NOT NULL REFERENCES app_schema.admin(id) ,
);
  
-- je dois creer une table de liaison entre programme et mentors (car j'ajoute un ou plusieurs mentors pour un programme 
-- cest une relation n-n car un programme a plusieurs mentors et un mentor peut encadrer plusieurs programme cest pour sa on ajouter
  CREATE TABLE app_schema.programme_mentors(
    programme_id INT REFERENCES app_schema.programme(id) ON DELETE CASCADE,
    mentor_id INT REFERENCES app_schema.mentors(utilisateur_id) ON DELETE CASCADE,
    PRIMARY KEY ( programme_id,mentor_id ) -- cle primaire composé
  )
  --creation de la table phase
  CREATE TABLE app_schema.phase(
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255),
    description TEXT,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    gagnant BOOLEAN DEFAULT false,
    programme_id INT REFERENCES programme(id),
  );
  --creation de  table admin
 CREATE TABLE app_schema.admin(
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    motDePasse VARCHAR(255) NOT NULL
 )
 -- ajout de la colonne pour lier un admin a pluisieurs programmes cree dans la table programme
 -- car un admin ---> a plusieurs programmes
 ALTER TABLE app_schema.programme
ADD COLUMN admin_id INT DEFAULT 1 NOT NULL; -- 1 = ID d'un admin existant

 ALTER TABLE app_schema.programme
ADD CONSTRAINT fk_programme_admin
FOREIGN KEY (admin_id) REFERENCES app_schema.admin(id);

--un  programme a plusieurs phases 
--un admin a plusieurs programme
-- une phase a plusieurs taches

--creation de la table tache
CREATE TABLE app_schema.tache(
 id SERIAL PRIMARY KEY,
 nom VARCHAR(255) NOT NULL,
 description TEXT ,
 date_decheance DATE NOT NULL,
 --permet bien à une phase de contenir plusieurs tâches
 phase_id INT NOT NULL REFERENCES phase(id),
)
--creation de la table reunion
CREATE TABLE app_schema.reunion(
    id SERIAL PRIMARY KEY,
    nom_reunion VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    heure TIME NOT NULL,
    lieu TEXT,
     phase_id INT REFERENCES app_schema.phase(id) ON DELETE CASCADE
     --chaque reunion est associer á une phase specifique , une phase peut avoir plusieurs reunions
)
 -- table de criteres d'evaluation
 CREATE TABLE app_schema.criteresdevaluation(
    id SERIAL PRIMARY KEY,
    nom_critere VARCHAR(255) NOT NULL,
    type VARCHAR(20)CHECK (type IN ('numerique', 'etoiles', 'oui_non', 'liste_deroulante')),
    poids INTEGER NOT NULL CHECK (poids > 0),
    ---- Correspondance exacte avec les cases à cocher du front(les cases á cocher pour mentors,equipes)
    accessible_mentors BOOLEAN DEFAULT false,
    accessible_equipes BOOLEAN DEFAULT false, 
    ---- Correspondance avec le selecteur "Rempli par"
    rempli_par VARCHAR(10) CHECK (rempli_par IN ('equipes', 'mentors')),
     -- Correspondance avec la checkbox de validation
    necessite_validation BOOLEAN DEFAULT false,
    --associer un critere a une phase specifique
 phase_id INTEGER NOT NULL REFERENCES app_schema.phase(id) ON DELETE CASCADE,
 )

 -- table pour les livrables
 CREATE TABLE app_schema.livrables(
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date_echeance DATE NOT NULL,
    types_fichiers TEXT[] NOT NULL -- Stocke les extensions (ex: ['pdf', 'docx'])
phase_id INTEGER NOT NULL REFERENCES app_schema.phase(id) ON DELETE CASCADE,);

-- table pour les questions
-- Création de la table des questions
CREATE TABLE app_schema.questions (
    id SERIAL PRIMARY KEY,
    -- Texte de la question (ex: "Quel est votre nom ?")
    texte_question TEXT NOT NULL,
    -- Description facultative (ex: "Veuillez fournir une réponse détaillée")
    description TEXT,
    -- Type de question (valeurs autorisées)
    type VARCHAR(50) NOT NULL CHECK (
        type IN (
            'Single-Line',    -- Text (Single Line)
            'Multi-Line',    -- Text (Multi-Line)
            'RadioButtons',        -- boutons_radio
            'Checkboxes',         -- Checkboxes
            'liste_deroulante',     -- Liste déroulante
            'telechargement_fichier',-- Téléchargement de fichier
            'evaluation'            -- Évaluation
        )
    ),
    -- Indique si la question est obligatoire (true/false)
    obligatoire BOOLEAN DEFAULT false
    -- ID du programme associé (clé étrangère)
    programme_id INTEGER NOT NULL REFERENCES app_schema.programme(id),
   
);
-- ajouter les columns a la table questions
ALTER TABLE app_schema.questions
ADD COLUMN evaluation_min INTEGER,
ADD COLUMN evaluation_max INTEGER;

--creation de fonction 

CREATE OR REPLACE FUNCTION app_schema.is_question_liste_deroulante(q_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM app_schema.questions 
        WHERE id = q_id 
        AND type = 'liste_deroulante' -- Vérification explicite
    );
END;
$$ LANGUAGE plpgsql;
--table pour les options si le type est une liste derourante
-- Étape 2 : Créer la table après avoir défini la fonction
CREATE TABLE app_schema.question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES app_schema.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    ordre INTEGER,
    -- Contrainte utilisant la fonction
    CONSTRAINT check_type_liste_deroulante 
        CHECK (app_schema.is_question_liste_deroulante(question_id))
);

--creation table formulaire de candidature
CREATE TABLE app_schema.formulaires (
    id SERIAL PRIMARY KEY,
    programme_id INTEGER UNIQUE NOT NULL REFERENCES app_schema.programme(id) ON DELETE CASCADE, -- Contrainte UNIQUE pour 1 formulaire par programme
    titre VARCHAR(255) NOT NULL,
    url_formulaire TEXT UNIQUE NOT NULL,
    description TEXT,
    message_confirmation TEXT
);
--Enregistrer chaque soumission(presentation) d'un formulaire par un utilisateur
CREATE TABLE app_schema.soumissions (
    id SERIAL PRIMARY KEY,
    --Lien vers le formulaire rempli
    formulaire_id INTEGER NOT NULL REFERENCES app_schema.formulaires(id) ON DELETE CASCADE,
    --Identifie qui a rempli le formulaire 
    utilisateur_id INTEGER NOT NULL,
    --Type de candidat (startup ou particulier
    role app_schema.role_utilisateur NOT NULL,
    FOREIGN KEY (utilisateur_id, role) 
        REFERENCES app_schema.utilisateur(id, role) ON DELETE CASCADE
);
--Stocker les réponses aux questions pour chaque soumission.
CREATE TABLE app_schema.reponses(
    id SERIAL PRIMARY KEY,
    --Lien vers la soumission (pour regrouper toutes les réponses d'une personne)
    soumission_id INTEGER NOT NULL REFERENCES app_schema.soumissions(id) ON DELETE CASCADE,
    --Question à laquelle répond l'utilisateur
    question_id INTEGER NOT NULL REFERENCES app_schema.questions(id) ON DELETE CASCADE,
    --	Réponse donnée par l'utilisateur
    valeur TEXT NOT NULL
);
-- id, programme_id Un formulaire est lié à un seul programme
--id, programme_id Les questions sont liées au même programme que le formulaire.
--id, formulaire_id	Une soumission est liée à un formulaire spécifique.
--soumission_id, question_id	Une réponse est liée à une soumission et à une question.
-- ajouter une colonne biographie
ALTER TABLE utilisateur
ADD COLUMN biographie TEXT;


--hadi la table tstoki les infos d'une candidature (tocke les équipes créées avec id...)
CREATE TABLE app_schema.candidatures(
    id SERIAL primary key,
    nom_equipe VARCHAR(255) NOT NULL,
    description_equipe TEXT ,
    programme_id INTEGER NOT NULL REFERENCES app_schema.programme(id) ON DELETE CASCADE
)

--cest une table de liaison  qui associe les soumissions(startup,particulier  á une equipe) donc permet á une equipe davoir plusieurs membres
CREATE TABLE app_schema.candidatures_membres (
    candidatures_id INTEGER NOT NULL REFERENCES app_schema.candidatures(id) ON DELETE CASCADE,
    soumission_id INTEGER NOT NULL REFERENCES app_schema.soumissions(id) ON DELETE CASCADE,
    PRIMARY KEY (candidatures_id, soumission_id),
    CONSTRAINT unique_soumission_id UNIQUE (soumission_id)
);

-- Create notifications table
CREATE TABLE app_schema.notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_role app_schema.role_utilisateur NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'program_invitation', 'message', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id INTEGER, -- ID of the related entity (program, message, etc.)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id, user_role) 
        REFERENCES app_schema.utilisateur(id, role) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user ON app_schema.notifications(user_id, user_role);
   
/*ma nouvelle table programme_soumissions:
Elle crée une relation directe entre une soumission et un programme
C'est exactement ce qui se passe quand l'admin clique sur "Add to Program"*/
CREATE TABLE  app_schema.programme_soumissions (
  id SERIAL PRIMARY KEY,
  programme_id INTEGER NOT NULL REFERENCES app_schema.programme(id) ON DELETE CASCADE,
  soumission_id INTEGER NOT NULL REFERENCES app_schema.soumissions(id) ON DELETE CASCADE,
  date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(programme_id, soumission_id)
);
/* Le But de UNIQUE DANS CETTE TABLE :
Éviter les doublons - Cela empêche d'ajouter la même startup au même programme plusieurs fois
Cohérence avec l'interface - Quand un admin clique sur "Add to Program", cette action ne doit pouvoir être effectuée qu'une seule fois avec succès*/
--table admin+mentor
  CREATE TABLE app_schema.admin_mentors (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER REFERENCES app_schema.admin(id),
          mentor_id INTEGER REFERENCES app_schema.mentors(utilisateur_id),
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(admin_id, mentor_id)
        );


        -- Table pour suivre la progression des équipes dans les phases
CREATE TABLE app_schema.candidatures_phases (
  candidature_id INTEGER NOT NULL REFERENCES app_schema.candidatures(id) ON DELETE CASCADE,
  phase_id INTEGER NOT NULL REFERENCES app_schema.phase(id) ON DELETE CASCADE,
  date_passage TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (candidature_id, phase_id)
);

-- Ajouter un champ type à la table candidatures
ALTER TABLE app_schema.candidatures 
ADD COLUMN type VARCHAR(50) DEFAULT 'equipe';


-- Ajouter une colonne pour stocker l'ID de la candidature gagnante
ALTER TABLE app_schema.phase
ADD COLUMN gagnant_candidature_id INTEGER 
REFERENCES app_schema.candidatures(id) ON DELETE SET NULL;


CREATE TABLE app_schema.options_critere(
    id SERIAL PRIMARY KEY,
    critere_id INTEGER NOT NULL REFERENCES app_schema.criteresdevaluation(id) ON DELETE CASCADE,
    valeur VARCHAR(255) NOT NULL
);

-- Create ENUM type for program status
CREATE TYPE app_schema.programme_status AS ENUM (
    'Brouillon',
    'Actif',
    'Terminé'
);

-- Create ENUM type for program template flag
CREATE TYPE app_schema.programme_template AS ENUM (
    'Modèle',
    'Non-Modèle'
);

-- Add status columns to the programme table
ALTER TABLE app_schema.programme 
ADD COLUMN status app_schema.programme_status NOT NULL DEFAULT 'Brouillon',
ADD COLUMN is_template app_schema.programme_template NOT NULL DEFAULT 'Non-Modèle';

-- Add index for faster queries on status
CREATE INDEX idx_programme_status ON app_schema.programme(status);
CREATE INDEX idx_programme_template ON app_schema.programme(is_template);

-- Add created_at timestamp column to soumissions table
ALTER TABLE app_schema.soumissions
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have a timestamp (use current time as fallback)
UPDATE app_schema.soumissions
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL;

--table pour les reponses des criteres devaluation:
--Garantit qu’une équipe ne peut répondre qu’une seule fois à un même critère UNIQUE (candidature_id, critere_id)
CREATE TABLE app_schema.note(
    id SERIAL PRIMARY KEY,
    candidature_id INTEGER NOT NULL REFERENCES app_schema.candidatures(id) ON DELETE CASCADE,
    critere_id INTEGER NOT NULL REFERENCES app_schema.criteresdevaluation(id) ON DELETE CASCADE,
    valeur TEXT NOT NULL,
    UNIQUE (candidature_id, critere_id) -- Une réponse unique par critère/candidature
);


--Permet de savoir quel mentor a soumis/modifié une réponse

ALTER TABLE app_schema.note
ADD COLUMN IF NOT EXISTS valide BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS valide_par_mentor_id INT REFERENCES app_schema.mentors(utilisateur_id);

-- Ajout de la contrainte unique si elle n'existe pas
ALTER TABLE app_schema.note 
ADD CONSTRAINT unique_candidature_critere 
UNIQUE (candidature_id, critere_id);

--pour sauvegarde id du mentors qui a rempli un critere (autoriser pour remplir par lui )
ALTER TABLE app_schema.note
ADD COLUMN IF NOT EXISTS rempli_par_mentor_id INT REFERENCES app_schema.mentors(utilisateur_id);

--pour saissir la note
CREATE TABLE app_schema.note_phase (
    id SERIAL PRIMARY KEY,
    phase_id INTEGER NOT NULL REFERENCES app_schema.phase(id) ON DELETE CASCADE,
    candidature_id INTEGER NOT NULL REFERENCES app_schema.candidatures(id) ON DELETE CASCADE,
    mentor_id INTEGER NOT NULL REFERENCES app_schema.mentors(utilisateur_id) ON DELETE CASCADE,
    note DECIMAL(20,4) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Un mentor ne peut noter qu'une fois par phase/candidature
    UNIQUE (phase_id, candidature_id, mentor_id)
);