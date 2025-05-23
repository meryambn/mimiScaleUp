import express from 'express';
import { notificationController } from '../controllers/notificationController.js';

const router = express.Router();

// Get notifications for a user
router.get('/:userId/:userRole', notificationController.getNotifications);

// Mark a notification as read
router.put('/read/:notificationId', notificationController.markAsRead);

// Mark all notifications as read for a user
router.put('/read-all/:userId/:userRole', notificationController.markAllAsRead);

// Get unread notification count for a user
router.get('/unread/:userId/:userRole', notificationController.getUnreadCount);

// Create a notification for form access
router.post('/form-access', notificationController.createFormAccessNotification);

// Create a notification for a new chat message
router.post('/chat-message', notificationController.createChatNotification);

export default router;