import { AdminMentor } from '../models/adminMentor.js';
import { Notification } from '../models/notification.js';
import pool from '../../db.js';

export const adminMentorController = {
  // Add a mentor to an admin's pool
  async addMentorToAdmin(req, res) {
    try {
      const { mentor_id } = req.body;
      const admin_id = req.headers['x-admin-id'] || req.admin_id || 1; // Get from header, authenticated admin, or default to 1

      if (!mentor_id) {
        return res.status(400).json({ error: 'ID du mentor manquant' });
      }

      // Check if mentor exists
      const mentorExists = await pool.query(
        'SELECT 1 FROM app_schema.mentors WHERE utilisateur_id = $1',
        [mentor_id]
      );

      if (mentorExists.rows.length === 0) {
        return res.status(404).json({ error: 'Mentor non trouvé' });
      }

      // Add mentor to admin's pool
      await AdminMentor.addMentorToAdmin(admin_id, mentor_id);

      // Get admin details for the notification
      const adminResult = await pool.query(
        'SELECT email FROM app_schema.admin WHERE id = $1',
        [admin_id]
      );

      const adminEmail = adminResult.rows.length > 0 ? adminResult.rows[0].email : 'Un administrateur';

      // Create a notification for the mentor
      await Notification.create({
        user_id: mentor_id,
        user_role: 'mentor',
        type: 'mentor_pool_invitation',
        title: 'Invitation au réseau de mentors',
        message: `${adminEmail} vous a ajouté à son réseau de mentors.`,
        related_id: admin_id,
        is_read: false
      });

      res.status(200).json({ message: 'Mentor ajouté avec succès' });
    } catch (error) {
      console.error('Error adding mentor to admin:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Remove a mentor from an admin's pool
  async removeMentorFromAdmin(req, res) {
    try {
      const { mentor_id } = req.params;
      const admin_id = req.headers['x-admin-id'] || req.admin_id || 1; // Get from header, authenticated admin, or default to 1

      if (!mentor_id) {
        return res.status(400).json({ error: 'ID du mentor manquant' });
      }

      // Remove mentor from admin's pool
      await AdminMentor.removeMentorFromAdmin(admin_id, mentor_id);

      res.status(200).json({ message: 'Mentor retiré avec succès' });
    } catch (error) {
      console.error('Error removing mentor from admin:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Get all mentors for an admin
  async getMentorsForAdmin(req, res) {
    try {
      const admin_id = req.headers['x-admin-id'] || req.admin_id || 1; // Get from header, authenticated admin, or default to 1

      // Get mentors for admin
      const mentors = await AdminMentor.getMentorsForAdmin(admin_id);

      res.status(200).json(mentors);
    } catch (error) {
      console.error('Error getting mentors for admin:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Get all available mentors (not yet in admin's pool)
  async getAvailableMentors(req, res) {
    try {
      const admin_id = req.headers['x-admin-id'] || req.admin_id || 1; // Get from header, authenticated admin, or default to 1

      // Get available mentors
      const mentors = await AdminMentor.getAvailableMentors(admin_id);

      res.status(200).json(mentors);
    } catch (error) {
      console.error('Error getting available mentors:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

