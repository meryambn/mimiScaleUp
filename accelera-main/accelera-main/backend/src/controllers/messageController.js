import { Message } from '../models/message.js';
import { Conversation } from '../models/conversation.js';
import { Notification } from '../models/notification.js';

export const messageController = {
    // Send a new message
    async sendMessage(req, res) {
        try {
            const { recipient_id, recipient_role, content } = req.body;
            const sender_id = parseInt(req.body.sender_id || req.user?.id);
            const sender_role = req.body.sender_role || req.user?.role;

            if (!sender_id || !sender_role || !recipient_id || !recipient_role || !content) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const message = new Message(
                null,
                sender_id,
                sender_role,
                recipient_id,
                recipient_role,
                content,
                false
            );

            const createdMessage = await Message.create(message);

            // Create a notification for the recipient
            await Notification.create({
                user_id: recipient_id,
                user_role: recipient_role,
                type: 'new_message',
                title: 'Nouveau message',
                message: `Vous avez reçu un nouveau message.`,
                related_id: createdMessage.id,
                is_read: false
            });

            res.status(201).json(createdMessage);
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Get conversation between two users
    async getConversation(req, res) {
        try {
            const user1_id = parseInt(req.params.user1_id);
            const user1_role = req.params.user1_role;
            const user2_id = parseInt(req.params.user2_id);
            const user2_role = req.params.user2_role;
            const limit = parseInt(req.query.limit || 50);
            const offset = parseInt(req.query.offset || 0);

            if (!user1_id || !user1_role || !user2_id || !user2_role) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const messages = await Message.getConversation(user1_id, user1_role, user2_id, user2_role, limit, offset);
            res.status(200).json(messages);
        } catch (error) {
            console.error('Error getting conversation:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Mark a message as read
    async markAsRead(req, res) {
        try {
            const messageId = parseInt(req.params.messageId);

            if (!messageId) {
                return res.status(400).json({ error: 'Message ID is required' });
            }

            const updatedMessage = await Message.markAsRead(messageId);
            res.status(200).json(updatedMessage);
        } catch (error) {
            console.error('Error marking message as read:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Mark all messages from a sender to a recipient as read
    async markAllAsRead(req, res) {
        try {
            const sender_id = parseInt(req.params.senderId);
            const sender_role = req.params.senderRole;
            const recipient_id = parseInt(req.params.recipientId);
            const recipient_role = req.params.recipientRole;

            if (!sender_id || !sender_role || !recipient_id || !recipient_role) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const updatedMessages = await Message.markAllAsRead(sender_id, sender_role, recipient_id, recipient_role);
            res.status(200).json(updatedMessages);
        } catch (error) {
            console.error('Error marking all messages as read:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Get unread message count for a user
    async getUnreadCount(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const userRole = req.params.userRole;

            if (!userId || !userRole) {
                return res.status(400).json({ error: 'User ID and role are required' });
            }

            const count = await Message.getUnreadCount(userId, userRole);
            res.status(200).json({ count });
        } catch (error) {
            console.error('Error getting unread count:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Get all conversations for a user
    async getConversations(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const userRole = req.params.userRole;

            if (!userId || !userRole) {
                return res.status(400).json({ error: 'User ID and role are required' });
            }

            const conversations = await Conversation.getForUser(userId, userRole);
            res.status(200).json(conversations);
        } catch (error) {
            console.error('Error getting conversations:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Get all potential contacts for a user
    async getPotentialContacts(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const userRole = req.params.userRole;

            console.log(`API request for contacts: userId=${userId}, userRole=${userRole}`);

            if (!userId || !userRole) {
                console.error('Missing parameters:', { userId, userRole });
                return res.status(400).json({ error: 'User ID and role are required' });
            }

            // Validate user role
            const validRoles = ['admin', 'mentor', 'startup', 'particulier'];
            if (!validRoles.includes(userRole)) {
                console.error(`Invalid role: ${userRole}`);
                return res.status(400).json({ error: 'Invalid user role' });
            }

            // Handle 'particulier' role as 'startup'
            const normalizedRole = userRole === 'particulier' ? 'startup' : userRole;
            if (normalizedRole !== userRole) {
                console.log(`Normalized role from ${userRole} to ${normalizedRole}`);
            }

            // Get contacts
            const contacts = await Conversation.getPotentialContacts(userId, normalizedRole);

            // Even if no contacts are found, return an empty array (not an error)
            console.log(`Returning ${contacts.length} contacts for user ${userId} (${userRole})`);
            res.status(200).json(contacts);
        } catch (error) {
            console.error('Error getting potential contacts:', error);
            // Provide more detailed error message
            res.status(500).json({
                error: 'Server error',
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
};
