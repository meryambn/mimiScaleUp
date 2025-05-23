import { Notification } from '../models/notification.js';
import { Message } from '../models/message.js';
import pool from '../../db.js';

export const notificationController = {
    // Get notifications for a user
    async getNotifications(req, res) {
        try {
            const userId = req.params.userId;
            const userRole = req.params.userRole;

            if (!userId || !userRole) {
                return res.status(400).json({ error: 'User ID and role are required' });
            }

            const notifications = await Notification.getByUserId(userId, userRole);
            res.status(200).json(notifications);
        } catch (error) {
            console.error('Error getting notifications:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Mark a notification as read
    async markAsRead(req, res) {
        try {
            const notificationId = req.params.notificationId;

            if (!notificationId) {
                return res.status(400).json({ error: 'Notification ID is required' });
            }

            const notification = await Notification.markAsRead(notificationId);

            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            res.status(200).json(notification);
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Mark all notifications as read for a user
    async markAllAsRead(req, res) {
        try {
            const userId = req.params.userId;
            const userRole = req.params.userRole;

            if (!userId || !userRole) {
                return res.status(400).json({ error: 'User ID and role are required' });
            }

            const notifications = await Notification.markAllAsRead(userId, userRole);
            res.status(200).json(notifications);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Get unread notification count for a user
    async getUnreadCount(req, res) {
        try {
            const userId = req.params.userId;
            const userRole = req.params.userRole;

            if (!userId || !userRole) {
                return res.status(400).json({ error: 'User ID and role are required' });
            }

            const count = await Notification.getUnreadCount(userId, userRole);
            res.status(200).json({ count });
        } catch (error) {
            console.error('Error getting unread notification count:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Create a notification for form access
    async createFormAccessNotification(req, res) {
        try {
            const { userId, userRole, programId, programName } = req.body;

            if (!userId || !userRole || !programId || !programName) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Check if a notification for this form access already exists
            const existingNotifications = await Notification.getByUserIdAndType(
                userId,
                userRole,
                'form_access',
                programId
            );

            // If notification already exists, don't create a new one
            if (existingNotifications.length > 0) {
                return res.status(200).json({
                    message: 'Notification already exists',
                    notification: existingNotifications[0]
                });
            }

            // Create a new notification
            const notification = await Notification.create({
                user_id: userId,
                user_role: userRole,
                type: 'form_access',
                title: 'Formulaire de candidature',
                message: `Un formulaire de candidature a été partagé avec vous pour le programme "${programName}"`,
                related_id: programId,
                is_read: false
            });

            res.status(201).json({
                message: 'Notification created successfully',
                notification
            });
        } catch (error) {
            console.error('Error creating form access notification:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Create a notification for a new chat message
    async createChatNotification(req, res) {
        try {
            const { senderId, senderRole, recipientId, recipientRole, messageId, messageContent } = req.body;

            if (!senderId || !senderRole || !recipientId || !recipientRole || !messageId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Get sender name based on role
            let senderName = 'Un utilisateur';
            if (senderRole === 'startup') {
                const { rows } = await pool.query(
                    'SELECT nom_entreprise FROM app_schema.startups WHERE utilisateur_id = $1',
                    [senderId]
                );
                if (rows.length > 0) {
                    senderName = rows[0].nom_entreprise;
                }
            } else if (senderRole === 'mentor') {
                const { rows } = await pool.query(
                    'SELECT nom, prenom FROM app_schema.mentors WHERE utilisateur_id = $1',
                    [senderId]
                );
                if (rows.length > 0) {
                    senderName = `${rows[0].prenom} ${rows[0].nom}`;
                }
            } else if (senderRole === 'admin') {
                senderName = 'Administrateur';
            }

            // Create a preview of the message (first 50 characters)
            const messagePreview = messageContent ?
                (messageContent.length > 50 ? messageContent.substring(0, 47) + '...' : messageContent) :
                'Nouveau message';

            // Create a notification
            const notification = await Notification.create({
                user_id: recipientId,
                user_role: recipientRole,
                type: 'new_message',
                title: `Message de ${senderName}`,
                message: messagePreview,
                related_id: messageId,
                is_read: false
            });

            res.status(201).json({
                message: 'Notification created successfully',
                notification
            });
        } catch (error) {
            console.error('Error creating chat notification:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};