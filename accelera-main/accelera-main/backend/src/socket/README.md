# Chat System with Real-time Notifications

This module implements a real-time chat system with notifications for the Accelera platform. It allows admins, mentors, and startups to communicate with each other in real-time.

## Features

- Real-time messaging between users
- Persistent message storage in the database
- Notifications for new messages
- Message read status tracking
- Typing indicators
- Conversation history

## Setup

1. Install dependencies:
   ```bash
   npm install socket.io
   ```

2. Create the database schema:
   ```bash
   node src/db/runChatSchema.js
   ```

3. The server is already configured to use Socket.IO in app.js.

## API Endpoints

### Messages API

- `POST /api/messages/send` - Send a new message
- `GET /api/messages/conversation/:user1_id/:user1_role/:user2_id/:user2_role` - Get conversation between two users
- `PUT /api/messages/read/:messageId` - Mark a message as read
- `PUT /api/messages/read-all/:senderId/:senderRole/:recipientId/:recipientRole` - Mark all messages from a sender as read
- `GET /api/messages/unread/:userId/:userRole` - Get unread message count for a user
- `GET /api/messages/conversations/:userId/:userRole` - Get all conversations for a user
- `GET /api/messages/contacts/:userId/:userRole` - Get all potential contacts for a user

### Notifications API

- `POST /api/notifications/chat-message` - Create a notification for a new chat message

## Socket.IO Events

### Client to Server

- `private-message` - Send a private message to another user
  ```javascript
  socket.emit('private-message', {
    recipientId: 123,
    recipientRole: 'mentor',
    content: 'Hello, how are you?'
  });
  ```

- `mark-message-read` - Mark a message as read
  ```javascript
  socket.emit('mark-message-read', {
    messageId: 456
  });
  ```

- `mark-all-messages-read` - Mark all messages from a sender as read
  ```javascript
  socket.emit('mark-all-messages-read', {
    senderId: 123,
    senderRole: 'mentor'
  });
  ```

- `typing` - Indicate that the user is typing
  ```javascript
  socket.emit('typing', {
    recipientId: 123,
    recipientRole: 'mentor'
  });
  ```

- `stop-typing` - Indicate that the user has stopped typing
  ```javascript
  socket.emit('stop-typing', {
    recipientId: 123,
    recipientRole: 'mentor'
  });
  ```

### Server to Client

- `message-sent` - Confirmation that a message was sent
- `new-message` - Notification of a new message
- `new-notification` - Notification of a new notification
- `message-read` - Notification that a message was read
- `message-marked-read` - Confirmation that a message was marked as read
- `all-messages-read` - Notification that all messages were read
- `all-messages-marked-read` - Confirmation that all messages were marked as read
- `user-typing` - Notification that a user is typing
- `user-stop-typing` - Notification that a user has stopped typing
- `error` - Error notification

## Client Connection Example

```javascript
import { io } from 'socket.io-client';

// Connect to the server
const socket = io('http://localhost:8083', {
  auth: {
    userId: 123,
    userRole: 'mentor'
  }
});

// Listen for connection
socket.on('connect', () => {
  console.log('Connected to chat server');
});

// Listen for new messages
socket.on('new-message', (message) => {
  console.log('New message:', message);
});

// Listen for errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Send a message
function sendMessage(recipientId, recipientRole, content) {
  socket.emit('private-message', {
    recipientId,
    recipientRole,
    content
  });
}

// Mark a message as read
function markAsRead(messageId) {
  socket.emit('mark-message-read', {
    messageId
  });
}
```

## Security Considerations

- Authentication is required for all socket connections
- Messages are stored in the database with sender and recipient information
- Notifications are created for all new messages
- Only users who are part of a conversation can access the messages
