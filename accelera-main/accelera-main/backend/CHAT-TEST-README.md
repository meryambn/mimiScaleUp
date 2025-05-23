# Chat System Test Scripts

This directory contains test scripts for the chat system functionality.

## Prerequisites

1. The server must be running (`node app.js`)
2. The database schema must be created (run `node src/db/runChatSchema.js` if not already done)
3. Socket.IO must be installed (`npm install socket.io socket.io-client --save`)
4. The test scripts use ES modules syntax (compatible with your project's "type": "module" setting)

## Test Scripts

### 1. REST API Test

This script tests the REST API endpoints for the chat system.

```bash
node test-chat-api.js
```

This will:
- Send a test message from admin to mentor
- Retrieve the conversation between them
- Get unread message count
- Get all conversations for admin
- Get potential contacts for admin
- Create a notification for the message
- Mark the message as read
- Get notifications for mentor

### 2. WebSocket Test

This script tests the real-time WebSocket functionality.

```bash
node test-chat-socket.js
```

This will:
- Connect to the WebSocket server as both admin and mentor
- Allow you to send a real-time message from admin to mentor
- Test typing indicators
- Test marking messages as read

## User IDs for Testing

The test scripts use the following user IDs:
- Admin: ID 1, role 'admin'
- Mentor: ID 2, role 'mentor'
- Startup: ID 3, role 'startup'

You may need to modify these IDs in the test scripts to match actual users in your database.

## Troubleshooting

If you encounter any issues:

1. Make sure the server is running on port 8083
2. Check that Socket.IO is properly installed
3. Verify that the database schema has been created
4. Check the console for error messages

For WebSocket connection issues, make sure CORS is properly configured in the server.
