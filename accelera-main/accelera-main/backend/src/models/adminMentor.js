import pool from '../../db.js';

export class AdminMentor {
  constructor(id, admin_id, mentor_id, status, created_at) {
    this.id = id;
    this.admin_id = admin_id;
    this.mentor_id = mentor_id;
    this.status = status;
    this.created_at = created_at;
  }

  // Get mentor ID column name
  static async getMentorIdColumn() {
    try {
      const tableInfo = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'app_schema'
        AND table_name = 'mentors'
      `);

      // Find the ID column name (could be id, utilisateur_id, etc.)
      const idColumn = tableInfo.rows.find(row =>
        row.column_name === 'id' ||
        row.column_name === 'utilisateur_id' ||
        row.column_name.includes('id')
      )?.column_name;

      if (!idColumn) {
        throw new Error('Could not find ID column in mentors table');
      }

      return idColumn;
    } catch (error) {
      console.error('Error getting mentor ID column:', error);
      throw error;
    }
  }

  // Add a mentor to an admin's pool
  static async addMentorToAdmin(admin_id, mentor_id) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO app_schema.admin_mentors
        (admin_id, mentor_id)
        VALUES ($1, $2)
        ON CONFLICT (admin_id, mentor_id) DO NOTHING
        RETURNING id`,
        [admin_id, mentor_id]
      );

      return rows[0]?.id;
    } catch (error) {
      console.error('Error adding mentor to admin:', error);
      throw error;
    }
  }

  // Remove a mentor from an admin's pool
  static async removeMentorFromAdmin(admin_id, mentor_id) {
    try {
      await pool.query(
        `DELETE FROM app_schema.admin_mentors
        WHERE admin_id = $1 AND mentor_id = $2`,
        [admin_id, mentor_id]
      );
    } catch (error) {
      console.error('Error removing mentor from admin:', error);
      throw error;
    }
  }

  // Get all mentors for an admin
  static async getMentorsForAdmin(admin_id) {
    try {
      const idColumn = await this.getMentorIdColumn();

      const { rows } = await pool.query(
        `SELECT m.${idColumn} as id, m.*
        FROM app_schema.mentors m
        JOIN app_schema.admin_mentors am ON m.${idColumn} = am.mentor_id
        WHERE am.admin_id = $1 AND am.status = 'active'`,
        [admin_id]
      );

      return rows;
    } catch (error) {
      console.error('Error getting mentors for admin:', error);
      throw error;
    }
  }

  // Get all available mentors (not yet in admin's pool)
  static async getAvailableMentors(admin_id) {
    try {
      const idColumn = await this.getMentorIdColumn();

      const { rows } = await pool.query(
        `SELECT m.${idColumn} as id, m.*
        FROM app_schema.mentors m
        WHERE m.${idColumn} NOT IN (
          SELECT mentor_id FROM app_schema.admin_mentors WHERE admin_id = $1
        )`,
        [admin_id]
      );

      return rows;
    } catch (error) {
      console.error('Error getting available mentors:', error);
      throw error;
    }
  }

  // Check if a mentor is in an admin's pool
  static async isMentorInAdminPool(admin_id, mentor_id) {
    try {
      console.log(`Checking if mentor ${mentor_id} is in admin ${admin_id}'s pool...`);

      const { rows } = await pool.query(
        `SELECT 1 FROM app_schema.admin_mentors
        WHERE admin_id = $1 AND mentor_id = $2 AND status = 'active'`,
        [admin_id, mentor_id]
      );

      const isInPool = rows.length > 0;
      console.log(`Query result: ${JSON.stringify(rows)}`);
      console.log(`Is mentor ${mentor_id} in admin ${admin_id}'s pool: ${isInPool}`);

      return isInPool;
    } catch (error) {
      console.error('Error checking if mentor is in admin pool:', error);
      throw error;
    }
  }
}