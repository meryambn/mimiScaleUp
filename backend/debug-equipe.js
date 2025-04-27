import pool from './db.js';

// Function to check if the database connection is working
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Function to check if the equipe table exists and has the correct structure
async function checkEquipeTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'app_schema' AND table_name = 'equipe'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Equipe table exists with the following columns:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
      return true;
    } else {
      console.log('❌ Equipe table does not exist or has no columns');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking equipe table:', error.message);
    return false;
  }
}

// Function to check if there are any startups in the database
async function checkStartups() {
  try {
    const result = await pool.query('SELECT * FROM app_schema.startups');
    
    if (result.rows.length > 0) {
      console.log('✅ Found startups in the database:');
      result.rows.forEach(startup => {
        console.log(`   - ID: ${startup.utilisateur_id}, Name: ${startup.nom_entreprise}`);
      });
      return result.rows;
    } else {
      console.log('❌ No startups found in the database');
      return [];
    }
  } catch (error) {
    console.error('❌ Error checking startups:', error.message);
    return [];
  }
}

// Function to manually insert a team member
async function insertTeamMember(startupId, matricule, nom, prenom) {
  try {
    const result = await pool.query(
      'INSERT INTO app_schema.equipe (matricule, nom, prenom, startup_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [matricule, nom, prenom, startupId]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Successfully inserted team member:', result.rows[0]);
      return true;
    } else {
      console.log('❌ Failed to insert team member');
      return false;
    }
  } catch (error) {
    console.error('❌ Error inserting team member:', error.message);
    return false;
  }
}

// Run all the tests
async function runTests() {
  console.log('=== Starting Database Tests ===');
  
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('❌ Cannot proceed with tests due to database connection failure');
    return;
  }
  
  // Check equipe table
  const tableExists = await checkEquipeTable();
  if (!tableExists) {
    console.log('❌ Cannot proceed with tests due to missing equipe table');
    return;
  }
  
  // Check startups
  const startups = await checkStartups();
  if (startups.length === 0) {
    console.log('❌ Cannot proceed with tests due to missing startups');
    return;
  }
  
  // Try to insert a team member
  const startupId = startups[0].utilisateur_id;
  console.log(`Attempting to insert team member for startup ID: ${startupId}`);
  await insertTeamMember(startupId, 12345, 'Doe', 'John');
  
  console.log('=== Tests Completed ===');
}

// Run the tests
runTests();
