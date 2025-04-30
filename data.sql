
-- 1. Créer la base de données 
--2.creation d'un schema
CREATE SCHEMA IF NOT EXISTS app_schema;

--permet de creer des tables dans le schema I_NOTE--
SET SEARCH_PATH = app_schema;

-- 2. Créer le type ENUM pour les rôles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_utilisateur') THEN
    CREATE TYPE role_utilisateur AS ENUM ('startup', 'mentor', 'particulier');
  END IF;
END$$;

-- 3. Table utilisateurs (parente)
--La clé étrangère lie chaque table fille (startups, mentors, etc.) à la table parente utilisateurs--
DROP TABLE IF EXISTS utilisateur CASCADE;
CREATE TABLE utilisateur (
    id SERIAL,-- le type SERIAL signifie que la valeur de la colonne est générée automatiquement par la base de données.
    email VARCHAR(255) UNIQUE NOT NULL,
    motDePasse VARCHAR(255) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    role role_utilisateur NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,--écrit la date et l'heure exacte quand vous ajoutez une nouvelle ligne dans table.
    PRIMARY KEY (id, role) -- Clé primaire composite
);

--4.table startups (enfant):
--FOREIGN KEY permet de créer une liaison logique entre la table parente (utilisateurs) et les tables enfants-- 
DROP TABLE IF EXISTS startups;
CREATE TABLE startups (
    utilisateur_id INT PRIMARY KEY,
    role role_utilisateur NOT NULL DEFAULT 'startup' CHECK (role = 'startup'),
    nom_entreprise VARCHAR(255) NOT NULL,
    site_web VARCHAR(255),
    annee_creation INT,
    nombre_employes INT,
    fichier_entreprise VARCHAR(255),
    FOREIGN KEY (utilisateur_id, role)
        REFERENCES utilisateur(id, role) ON DELETE CASCADE
);

-- 4. Table mentors (enfant):
DROP TABLE IF EXISTS mentors;
CREATE TABLE mentors (
    utilisateur_id INT PRIMARY KEY,
    role role_utilisateur NOT NULL DEFAULT 'mentor' CHECK (role = 'mentor'),
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    profession VARCHAR(100),
    FOREIGN KEY (utilisateur_id, role) 
        REFERENCES utilisateur(id, role) ON DELETE CASCADE
);

-- 5. Table particuliers (enfant):
DROP TABLE IF EXISTS particuliers;
CREATE TABLE particuliers (
    utilisateur_id INT PRIMARY KEY,
    role role_utilisateur NOT NULL DEFAULT 'particulier' CHECK (role = 'particulier'),
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    FOREIGN KEY (utilisateur_id, role) 
        REFERENCES utilisateur(id, role) ON DELETE CASCADE
);
