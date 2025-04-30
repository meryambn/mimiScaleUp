import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/vrbl.env' });

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function fixDatabase() {
  try {
    console.log('Adding default value to admin_id column...');
    
    // Add default value to admin_id column
    await pool.query(`
      ALTER TABLE app_schema.programme 
      ALTER COLUMN admin_id SET DEFAULT 1;
    `);
    
    console.log('Default value added successfully!');
    
    // Verify the change
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'app_schema'
      AND table_name = 'programme'
      AND column_name = 'admin_id';
    `);
    
    console.log('Updated admin_id column:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
  } catch (error) {
    console.error('Database fix error:', error);
  } finally {
    await pool.end();
  }
}

fixDatabase();
