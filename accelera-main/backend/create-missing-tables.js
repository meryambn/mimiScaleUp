import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './vrbl.env' });

// Create a new pool
const pool = new pg.Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function createMissingTables() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to the database. Creating missing tables...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Create the reunion table
    console.log('Creating reunion table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_schema.reunion (
        id SERIAL PRIMARY KEY,
        nom_reunion VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        heure TIME NOT NULL,
        lieu TEXT,
        phase_id INT REFERENCES app_schema.phase(id) ON DELETE CASCADE
      )
    `);
    console.log('Reunion table created successfully.');
    
    // Create the criteresdevaluation table
    console.log('Creating criteresdevaluation table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_schema.criteresdevaluation (
        id SERIAL PRIMARY KEY,
        nom_critere VARCHAR(255) NOT NULL,
        type VARCHAR(20) CHECK (type IN ('numerique', 'etoiles', 'oui_non', 'liste_deroulante')),
        poids INTEGER NOT NULL CHECK (poids > 0),
        accessible_mentors BOOLEAN DEFAULT false,
        accessible_equipes BOOLEAN DEFAULT false,
        rempli_par VARCHAR(10) CHECK (rempli_par IN ('equipes', 'mentors')),
        necessite_validation BOOLEAN DEFAULT false,
        phase_id INTEGER NOT NULL REFERENCES app_schema.phase(id) ON DELETE CASCADE
      )
    `);
    console.log('Criteresdevaluation table created successfully.');
    
    // Create the livrables table
    console.log('Creating livrables table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_schema.livrables (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        date_echeance DATE NOT NULL,
        types_fichiers TEXT[] NOT NULL,
        phase_id INTEGER NOT NULL REFERENCES app_schema.phase(id) ON DELETE CASCADE
      )
    `);
    console.log('Livrables table created successfully.');
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('All tables created successfully!');
    
    // Add some sample data for phase 14
    console.log('Adding sample data for phase 14...');
    
    // Add a sample reunion
    await client.query(`
      INSERT INTO app_schema.reunion (nom_reunion, date, heure, lieu, phase_id)
      VALUES ('Kickoff Meeting', '2025-05-01', '10:00', 'Conference Room A', 14)
    `);
    console.log('Sample reunion added.');
    
    // Add a sample critere
    await client.query(`
      INSERT INTO app_schema.criteresdevaluation (nom_critere, type, poids, accessible_mentors, accessible_equipes, rempli_par, necessite_validation, phase_id)
      VALUES ('Innovation Impact', 'numerique', 30, true, true, 'mentors', true, 14)
    `);
    console.log('Sample critere added.');
    
    // Add a sample livrable
    await client.query(`
      INSERT INTO app_schema.livrables (nom, description, date_echeance, types_fichiers, phase_id)
      VALUES ('Challenge Definition Document', 'Document outlining the innovation challenge and requirements', '2025-05-15', ARRAY['.pdf', '.docx'], 14)
    `);
    console.log('Sample livrable added.');
    
    console.log('All sample data added successfully!');
    
  } catch (err) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error creating tables:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

createMissingTables();
