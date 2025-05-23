import express from 'express';
import { adminMentorController } from '../controllers/adminMentorController.js';

const router = express.Router();

// Route to add a mentor to an admin's pool
router.post('/add', adminMentorController.addMentorToAdmin);

// Route to remove a mentor from an admin's pool
router.delete('/remove/:mentor_id', adminMentorController.removeMentorFromAdmin);

// Route to get all mentors for an admin
router.get('/admin-mentors', adminMentorController.getMentorsForAdmin);

// Route to get all available mentors (not yet in admin's pool)
router.get('/available', adminMentorController.getAvailableMentors);

export default router;