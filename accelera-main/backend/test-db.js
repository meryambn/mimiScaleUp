import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'vrbl.env') });

// Create a new pool
const pool = new pg.Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Test if the schema exists
    const schemaResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'app_schema'
    `);
    
    if (schemaResult.rows.length > 0) {
      console.log('app_schema exists');
    } else {
      console.error('app_schema does not exist');
    }
    
    // Test if the tables exist
    const tables = ['phase', 'reunion', 'criteresdevaluation', 'livrables'];
    
    for (const table of tables) {
      const tableResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'app_schema' AND table_name = $1
      `, [table]);
      
      if (tableResult.rows.length > 0) {
        console.log(`Table app_schema.${table} exists`);
        
        // Count rows in the table
        const countResult = await client.query(`
          SELECT COUNT(*) FROM app_schema.${table}
        `);
        
        console.log(`Table app_schema.${table} has ${countResult.rows[0].count} rows`);
      } else {
        console.error(`Table app_schema.${table} does not exist`);
      }
    }
    
    // Test if phase 14 exists
    const phaseResult = await client.query(`
      SELECT * FROM app_schema.phase WHERE id = 14
    `);
    
    if (phaseResult.rows.length > 0) {
      console.log('Phase 14 exists:', phaseResult.rows[0]);
      
      // Test if there are any reunions for phase 14
      const reunionResult = await client.query(`
        SELECT * FROM app_schema.reunion WHERE phase_id = 14
      `);
      
      console.log(`Found ${reunionResult.rows.length} reunions for phase 14`);
      
      // Test if there are any criteres for phase 14
      const critereResult = await client.query(`
        SELECT * FROM app_schema.criteresdevaluation WHERE phase_id = 14
      `);
      
      console.log(`Found ${critereResult.rows.length} criteres for phase 14`);
      
      // Test if there are any livrables for phase 14
      const livrableResult = await client.query(`
        SELECT * FROM app_schema.livrables WHERE phase_id = 14
      `);
      
      console.log(`Found ${livrableResult.rows.length} livrables for phase 14`);
    } else {
      console.error('Phase 14 does not exist');
    }
    
    client.release();
  } catch (err) {
    console.error('Error connecting to the database:', err);
  } finally {
    pool.end();
  }
}

testConnection();
