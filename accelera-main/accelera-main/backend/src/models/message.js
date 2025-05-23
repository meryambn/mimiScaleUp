import pool from '../../db.js';

export class Message {
    constructor(id, sender_id, sender_role, recipient_id, recipient_role, content, is_read, created_at) {
        this.id = id;
        this.sender_id = sender_id;
        this.sender_role = sender_role;
        this.recipient_id = recipient_id;
        this.recipient_role = recipient_role;
        this.content = content;
        this.is_read = is_read || false;
        this.created_at = created_at || new Date().toISOString();
    }

    // Create a new message
    static async create(message) {
        try {
            const { rows } = await pool.query(
                `INSERT INTO app_schema.messages
                (sender_id, sender_role, recipient_id, recipient_role, content, is_read)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [
                    message.sender_id,
                    message.sender_role,
                    message.recipient_id,
                    message.recipient_role,
                    message.content,
                    message.is_read || false
                ]
            );

            // Update or create conversation
            await this.updateConversation(
                message.sender_id, 
                message.sender_role, 
                message.recipient_id, 
                message.recipient_role, 
                rows[0].id
            );

            return rows[0];
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    }

    // Get messages between two users
    static async getConversation(user1_id, user1_role, user2_id, user2_role, limit = 50, offset = 0) {
        try {
            const { rows } = await pool.query(
                `SELECT * FROM app_schema.messages
                WHERE (sender_id = $1 AND sender_role = $2 AND recipient_id = $3 AND recipient_role = $4)
                OR (sender_id = $3 AND sender_role = $4 AND recipient_id = $1 AND recipient_role = $2)
                ORDER BY created_at DESC
                LIMIT $5 OFFSET $6`,
                [user1_id, user1_role, user2_id, user2_role, limit, offset]
            );
            return rows;
        } catch (error) {
            console.error('Error getting conversation:', error);
            throw error;
        }
    }

    // Mark a message as read
    static async markAsRead(messageId) {
        try {
            const { rows } = await pool.query(
                `UPDATE app_schema.messages
                SET is_read = true
                WHERE id = $1
                RETURNING *`,
                [messageId]
            );
            return rows[0];
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    }

    // Mark all messages from a sender to a recipient as read
    static async markAllAsRead(sender_id, sender_role, recipient_id, recipient_role) {
        try {
            const { rows } = await pool.query(
                `UPDATE app_schema.messages
                SET is_read = true
                WHERE sender_id = $1 AND sender_role = $2 AND recipient_id = $3 AND recipient_role = $4 AND is_read = false
                RETURNING *`,
                [sender_id, sender_role, recipient_id, recipient_role]
            );
            return rows;
        } catch (error) {
            console.error('Error marking all messages as read:', error);
            throw error;
        }
    }

    // Get unread message count for a user
    static async getUnreadCount(userId, userRole) {
        try {
            const { rows } = await pool.query(
                `SELECT COUNT(*) as count FROM app_schema.messages
                WHERE recipient_id = $1 AND recipient_role = $2 AND is_read = false`,
                [userId, userRole]
            );
            return parseInt(rows[0].count);
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error;
        }
    }

    // Get all conversations for a user
    static async getConversations(userId, userRole) {
        try {
            const { rows } = await pool.query(
                `SELECT c.*, 
                    CASE 
                        WHEN c.participant1_id = $1 AND c.participant1_role = $2 
                        THEN json_build_object('id', c.participant2_id, 'role', c.participant2_role) 
                        ELSE json_build_object('id', c.participant1_id, 'role', c.participant1_role) 
                    END as other_participant,
                    m.content as last_message_content,
                    m.created_at as last_message_time,
                    (SELECT COUNT(*) FROM app_schema.messages 
                     WHERE recipient_id = $1 AND recipient_role = $2 
                     AND is_read = false 
                     AND ((sender_id = c.participant1_id AND sender_role = c.participant1_role) 
                          OR (sender_id = c.participant2_id AND sender_role = c.participant2_role))
                    ) as unread_count
                FROM app_schema.conversations c
                LEFT JOIN app_schema.messages m ON c.last_message_id = m.id
                WHERE (c.participant1_id = $1 AND c.participant1_role = $2)
                OR (c.participant2_id = $1 AND c.participant2_role = $2)
                ORDER BY c.updated_at DESC`,
                [userId, userRole]
            );
            
            // For each conversation, get the other participant's details
            const conversationsWithDetails = await Promise.all(rows.map(async (conv) => {
                const otherParticipant = conv.other_participant;
                const { rows: userDetails } = await pool.query(
                    `SELECT id, email, role FROM app_schema.utilisateur WHERE id = $1 AND role = $2`,
                    [otherParticipant.id, otherParticipant.role]
                );
                
                // Get additional details based on role
                let additionalDetails = {};
                if (otherParticipant.role === 'startup') {
                    const { rows: startupDetails } = await pool.query(
                        `SELECT nom_entreprise as name FROM app_schema.startups WHERE utilisateur_id = $1`,
                        [otherParticipant.id]
                    );
                    additionalDetails = startupDetails[0] || {};
                } else if (otherParticipant.role === 'mentor') {
                    const { rows: mentorDetails } = await pool.query(
                        `SELECT nom, prenom FROM app_schema.mentors WHERE utilisateur_id = $1`,
                        [otherParticipant.id]
                    );
                    if (mentorDetails[0]) {
                        additionalDetails = {
                            name: `${mentorDetails[0].prenom} ${mentorDetails[0].nom}`
                        };
                    }
                } else if (otherParticipant.role === 'admin') {
                    additionalDetails = { name: 'Administrateur' };
                }
                
                return {
                    ...conv,
                    other_participant: {
                        ...otherParticipant,
                        ...userDetails[0],
                        ...additionalDetails
                    }
                };
            }));
            
            return conversationsWithDetails;
        } catch (error) {
            console.error('Error getting conversations:', error);
            throw error;
        }
    }

    // Update or create a conversation between two users
    static async updateConversation(user1_id, user1_role, user2_id, user2_role, messageId) {
        try {
            // Ensure consistent ordering of participants
            let participant1_id, participant1_role, participant2_id, participant2_role;
            
            if (user1_id < user2_id || (user1_id === user2_id && user1_role < user2_role)) {
                participant1_id = user1_id;
                participant1_role = user1_role;
                participant2_id = user2_id;
                participant2_role = user2_role;
            } else {
                participant1_id = user2_id;
                participant1_role = user2_role;
                participant2_id = user1_id;
                participant2_role = user1_role;
            }
            
            // Try to update existing conversation
            const { rowCount } = await pool.query(
                `UPDATE app_schema.conversations
                SET last_message_id = $1, updated_at = CURRENT_TIMESTAMP
                WHERE (participant1_id = $2 AND participant1_role = $3 AND participant2_id = $4 AND participant2_role = $5)
                OR (participant1_id = $4 AND participant1_role = $5 AND participant2_id = $2 AND participant2_role = $3)`,
                [messageId, participant1_id, participant1_role, participant2_id, participant2_role]
            );
            
            // If no rows were updated, create a new conversation
            if (rowCount === 0) {
                await pool.query(
                    `INSERT INTO app_schema.conversations
                    (participant1_id, participant1_role, participant2_id, participant2_role, last_message_id)
                    VALUES ($1, $2, $3, $4, $5)`,
                    [participant1_id, participant1_role, participant2_id, participant2_role, messageId]
                );
            }
        } catch (error) {
            console.error('Error updating conversation:', error);
            throw error;
        }
    }
}
