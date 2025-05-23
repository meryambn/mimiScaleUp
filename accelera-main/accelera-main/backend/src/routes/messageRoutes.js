import express from 'express';
import { messageController } from '../controllers/messageController.js';

const router = express.Router();

// Send a new message
router.post('/send', messageController.sendMessage);

// Get conversation between two users
router.get('/conversation/:user1_id/:user1_role/:user2_id/:user2_role', messageController.getConversation);

// Mark a message as read
router.put('/read/:messageId', messageController.markAsRead);

// Mark all messages from a sender to a recipient as read
router.put('/read-all/:senderId/:senderRole/:recipientId/:recipientRole', messageController.markAllAsRead);

// Get unread message count for a user
router.get('/unread/:userId/:userRole', messageController.getUnreadCount);

// Get all conversations for a user
router.get('/conversations/:userId/:userRole', messageController.getConversations);

// Get all potential contacts for a user
router.get('/contacts/:userId/:userRole', messageController.getPotentialContacts);

export default router;
