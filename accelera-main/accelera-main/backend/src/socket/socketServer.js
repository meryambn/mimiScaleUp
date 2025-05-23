import { Server } from 'socket.io';
import { Message } from '../models/message.js';
import { Notification } from '../models/notification.js';
import pool from '../../db.js';

// Map to store active user connections
const userConnections = new Map();

// Initialize Socket.IO server
export function initSocketServer(server) {
    const io = new Server(server, {
        cors: {
            origin: '*', // In production, restrict this to your frontend domain
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Middleware for authentication
    io.use((socket, next) => {
        const userId = socket.handshake.auth.userId;
        const userRole = socket.handshake.auth.userRole;

        if (!userId || !userRole) {
            return next(new Error('Authentication error'));
        }

        // Store user info in socket
        socket.userId = userId;
        socket.userRole = userRole;

        next();
    });

    // Connection event
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId} (${socket.userRole})`);

        // Store the connection
        const userKey = `${socket.userId}:${socket.userRole}`;
        if (!userConnections.has(userKey)) {
            userConnections.set(userKey, new Set());
        }
        userConnections.get(userKey).add(socket.id);

        // Join a room specific to this user
        socket.join(userKey);

        // Handle private messages
        socket.on('private-message', async (data) => {
            try {
                const { recipientId, recipientRole, content } = data;

                if (!recipientId || !recipientRole || !content) {
                    socket.emit('error', { message: 'Missing required fields' });
                    return;
                }

                // Create a temporary message object for immediate feedback
                const tempMessage = {
                    id: Date.now(), // Temporary ID that will be replaced
                    sender_id: socket.userId,
                    sender_role: socket.userRole,
                    recipient_id: recipientId,
                    recipient_role: recipientRole,
                    content: content,
                    is_read: false,
                    created_at: new Date().toISOString(),
                    senderName: socket.userRole === 'admin' ? 'Administrateur' : 'Vous'
                };

                // Send temporary message to sender immediately for instant feedback
                socket.emit('message-sent', tempMessage);

                // Create message in database (async operation)
                const message = new Message(
                    null,
                    socket.userId,
                    socket.userRole,
                    recipientId,
                    recipientRole,
                    content,
                    false
                );

                // Start database operations in parallel
                const savedMessagePromise = Message.create(message);

                // Get sender name based on role
                let senderNamePromise;
                if (socket.userRole === 'startup') {
                    senderNamePromise = pool.query(
                        'SELECT nom_entreprise FROM app_schema.startups WHERE utilisateur_id = $1',
                        [socket.userId]
                    ).then(result => {
                        return result.rows.length > 0 ? result.rows[0].nom_entreprise : 'Un utilisateur';
                    });
                } else if (socket.userRole === 'mentor') {
                    senderNamePromise = pool.query(
                        'SELECT nom, prenom FROM app_schema.mentors WHERE utilisateur_id = $1',
                        [socket.userId]
                    ).then(result => {
                        return result.rows.length > 0 ? `${result.rows[0].prenom} ${result.rows[0].nom}` : 'Un utilisateur';
                    });
                } else {
                    senderNamePromise = Promise.resolve(socket.userRole === 'admin' ? 'Administrateur' : 'Un utilisateur');
                }

                // Wait for both operations to complete
                const [savedMessage, senderName] = await Promise.all([savedMessagePromise, senderNamePromise]);

                // Create a notification for the recipient
                const notification = await Notification.create({
                    user_id: recipientId,
                    user_role: recipientRole,
                    type: 'new_message',
                    title: `Message de ${senderName}`,
                    message: content.length > 50 ? content.substring(0, 47) + '...' : content,
                    related_id: savedMessage.id,
                    is_read: false
                });

                // Prepare final message data with correct ID and metadata
                const messageData = {
                    ...savedMessage,
                    senderName
                };

                // Send final message to sender with correct ID
                socket.emit('message-updated', {
                    tempId: tempMessage.id,
                    message: messageData
                });

                // Send to recipient if online
                const recipientKey = `${recipientId}:${recipientRole}`;
                if (userConnections.has(recipientKey)) {
                    io.to(recipientKey).emit('new-message', messageData);
                    io.to(recipientKey).emit('new-notification', notification);
                }
            } catch (error) {
                console.error('Error handling private message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle message read status
        socket.on('mark-message-read', async (data) => {
            try {
                const { messageId } = data;

                if (!messageId) {
                    socket.emit('error', { message: 'Message ID is required' });
                    return;
                }

                const updatedMessage = await Message.markAsRead(messageId);

                // Notify sender that message was read
                if (updatedMessage) {
                    const senderKey = `${updatedMessage.sender_id}:${updatedMessage.sender_role}`;
                    if (userConnections.has(senderKey)) {
                        io.to(senderKey).emit('message-read', { messageId });
                    }
                }

                socket.emit('message-marked-read', { messageId });
            } catch (error) {
                console.error('Error marking message as read:', error);
                socket.emit('error', { message: 'Failed to mark message as read' });
            }
        });

        // Handle marking all messages as read
        socket.on('mark-all-messages-read', async (data) => {
            try {
                const { senderId, senderRole } = data;

                if (!senderId || !senderRole) {
                    socket.emit('error', { message: 'Sender information is required' });
                    return;
                }

                const updatedMessages = await Message.markAllAsRead(
                    senderId,
                    senderRole,
                    socket.userId,
                    socket.userRole
                );

                // Notify sender that messages were read
                const senderKey = `${senderId}:${senderRole}`;
                if (userConnections.has(senderKey)) {
                    io.to(senderKey).emit('all-messages-read', {
                        recipientId: socket.userId,
                        recipientRole: socket.userRole
                    });
                }

                socket.emit('all-messages-marked-read', {
                    senderId,
                    senderRole
                });
            } catch (error) {
                console.error('Error marking all messages as read:', error);
                socket.emit('error', { message: 'Failed to mark all messages as read' });
            }
        });

        // Handle user typing status
        socket.on('typing', (data) => {
            const { recipientId, recipientRole } = data;

            if (!recipientId || !recipientRole) {
                return;
            }

            const recipientKey = `${recipientId}:${recipientRole}`;
            if (userConnections.has(recipientKey)) {
                io.to(recipientKey).emit('user-typing', {
                    userId: socket.userId,
                    userRole: socket.userRole
                });
            }
        });

        // Handle user stopped typing status
        socket.on('stop-typing', (data) => {
            const { recipientId, recipientRole } = data;

            if (!recipientId || !recipientRole) {
                return;
            }

            const recipientKey = `${recipientId}:${recipientRole}`;
            if (userConnections.has(recipientKey)) {
                io.to(recipientKey).emit('user-stop-typing', {
                    userId: socket.userId,
                    userRole: socket.userRole
                });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId} (${socket.userRole})`);

            const userKey = `${socket.userId}:${socket.userRole}`;
            if (userConnections.has(userKey)) {
                userConnections.get(userKey).delete(socket.id);

                // If no more connections for this user, remove from map
                if (userConnections.get(userKey).size === 0) {
                    userConnections.delete(userKey);
                }
            }
        });
    });

    return io;
}
