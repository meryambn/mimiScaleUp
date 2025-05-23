// Test script for WebSocket chat functionality
import { io } from 'socket.io-client';
import readline from 'readline';

// Configuration
const SOCKET_URL = 'http://localhost:8083';

// Test users (replace with actual IDs from your database)
const ADMIN = { id: 1, role: 'admin' };
const MENTOR = { id: 2, role: 'mentor' };

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test WebSocket functionality
function testWebSocket() {
  console.log('\n=== Testing WebSocket Chat Functionality ===\n');

  // Connect as admin
  console.log('1. Connecting to WebSocket server as admin...');
  const adminSocket = io(SOCKET_URL, {
    auth: {
      userId: ADMIN.id,
      userRole: ADMIN.role
    }
  });

  // Connect as mentor
  console.log('2. Connecting to WebSocket server as mentor...');
  const mentorSocket = io(SOCKET_URL, {
    auth: {
      userId: MENTOR.id,
      userRole: MENTOR.role
    }
  });

  // Admin socket event handlers
  adminSocket.on('connect', () => {
    console.log('Admin connected to WebSocket server');
  });

  adminSocket.on('connect_error', (error) => {
    console.error('Admin connection error:', error.message);
  });

  adminSocket.on('message-sent', (message) => {
    console.log('Admin received message-sent event:', message);
  });

  adminSocket.on('message-read', (data) => {
    console.log('Admin received message-read event:', data);
  });

  adminSocket.on('error', (error) => {
    console.error('Admin socket error:', error);
  });

  // Mentor socket event handlers
  mentorSocket.on('connect', () => {
    console.log('Mentor connected to WebSocket server');
  });

  mentorSocket.on('connect_error', (error) => {
    console.error('Mentor connection error:', error.message);
  });

  mentorSocket.on('new-message', (message) => {
    console.log('Mentor received new-message event:', message);

    // Mark the message as read
    console.log('Mentor marking message as read...');
    mentorSocket.emit('mark-message-read', { messageId: message.id });
  });

  mentorSocket.on('new-notification', (notification) => {
    console.log('Mentor received new-notification event:', notification);
  });

  mentorSocket.on('error', (error) => {
    console.error('Mentor socket error:', error);
  });

  // Wait for connections to establish
  setTimeout(() => {
    // Interactive testing
    rl.question('\nDo you want to send a real-time message from admin to mentor? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        adminSocket.emit('private-message', {
          recipientId: MENTOR.id,
          recipientRole: MENTOR.role,
          content: 'Real-time test message via WebSocket'
        });

        console.log('Message sent via WebSocket');

        // Wait for events to be processed
        setTimeout(() => {
          rl.question('\nDo you want to test typing indicators? (y/n): ', (answer) => {
            if (answer.toLowerCase() === 'y') {
              console.log('Admin indicating typing...');
              adminSocket.emit('typing', {
                recipientId: MENTOR.id,
                recipientRole: MENTOR.role
              });

              setTimeout(() => {
                console.log('Admin stopped typing...');
                adminSocket.emit('stop-typing', {
                  recipientId: MENTOR.id,
                  recipientRole: MENTOR.role
                });

                finishTest(adminSocket, mentorSocket);
              }, 2000);
            } else {
              finishTest(adminSocket, mentorSocket);
            }
          });
        }, 2000);
      } else {
        finishTest(adminSocket, mentorSocket);
      }
    });
  }, 1000);
}

function finishTest(adminSocket, mentorSocket) {
  rl.question('\nDo you want to mark all messages as read? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      console.log('Marking all messages from admin to mentor as read...');
      mentorSocket.emit('mark-all-messages-read', {
        senderId: ADMIN.id,
        senderRole: ADMIN.role
      });

      setTimeout(() => {
        cleanup(adminSocket, mentorSocket);
      }, 2000);
    } else {
      cleanup(adminSocket, mentorSocket);
    }
  });
}

function cleanup(adminSocket, mentorSocket) {
  console.log('\nDisconnecting sockets...');
  adminSocket.disconnect();
  mentorSocket.disconnect();

  console.log('\n=== Test Complete ===');
  rl.close();
}

// Run the tests
testWebSocket();
