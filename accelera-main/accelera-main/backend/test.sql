-- Types ENUM pour les choix uniques
CREATE TYPE type_programme AS ENUM (
    'Programme Accélération',
    'Programme Incubation',
    'Hackathon',
    'Défi d''innovation',
    'Personnalisé'  -- Pour les programmes sans modèle prédéfini
);

CREATE TYPE phase_type AS ENUM (
    'Pre-seed', 
    'Seed', 
    'Series A', 
    'Series B', 
    'Growth'
);

CREATE TYPE industrie_type AS ENUM (
    'Technology', 
    'Healthcare', 
    'Fintech', 
    'Social Impact', 
    'Education', 
    'Other'
);

CREATE TYPE document_type AS ENUM (
    'Pitch Deck', 
    'Financial Projections', 
    'Team Bios', 
    'Business Plan'
);

-- Table des modèles prédéfinis
CREATE TABLE app_schema.modele (
    id SERIAL PRIMARY KEY,
    type type_programme UNIQUE NOT NULL,
    description TEXT,
    phases phase_type[] DEFAULT '{}',           --par default{} ma3ntha aha aykheliha vide aucun choix
    industries industrie_type[] DEFAULT '{}',  
    documents document_type[] DEFAULT '{}',     
    taille_equipe_min INT DEFAULT 1,
    taille_equipe_max INT DEFAULT 8,
    ca_min NUMERIC DEFAULT 0,
    ca_max NUMERIC DEFAULT 500000
);
-- Table des programmes
CREATE TABLE app_schema.programme (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    type type_programme NOT NULL,         -- Type obligatoire
    modele_id INT REFERENCES modele(id),   -- Null si 'Personnalisé'
     phases_requises phase_type[],  -- Tableau de phases (choix multiples)
    industries_requises industrie_type[],  -- Tableau d'industries
    documents_requis document_type[],  
   
    taille_equipe_min INT,
    taille_equipe_max INT,
    ca_min NUMERIC,
    ca_max NUMERIC,
    
   
    
);

