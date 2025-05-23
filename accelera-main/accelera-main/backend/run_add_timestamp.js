import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'add_timestamp.sql');
const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

// Execute the SQL script
async function runSqlScript() {
  try {
    console.log('Running SQL script to add timestamp column...');
    await pool.query(sqlScript);
    console.log('SQL script executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error executing SQL script:', error);
    process.exit(1);
  }
}

runSqlScript();
