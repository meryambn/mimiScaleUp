import React, { useState, useEffect, FormEvent } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import Sidebar from '@/components/sidebar';

interface Message {
  text: string;
  from: string;
  to: string;
  time: Date;
}

interface Users {
  lyna: Message[];
  meriem: Message[];
  [key: string]: Message[];
}

const FeedPage = () => {
  const [users, setUsers] = useState<Users>({
    lyna: [],
    meriem: []
  });

  const [currentUser, setCurrentUser] = useState<string>('lyna'); // Définir un utilisateur par défaut
  const [currentRecipient, setCurrentRecipient] = useState<string>('meriem'); // Définir un destinataire par défaut

  // Format time
  const formatTime = (date = new Date()) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleUserClick = (user: string) => {
    setCurrentUser(user);
    setCurrentRecipient(user === 'lyna' ? 'meriem' : 'lyna');
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const text = (form.elements.namedItem('message') as HTMLInputElement).value.trim();
    if (!text) return;

    const timestamp = new Date();
    
    const newMsg: Message = { 
      text, 
      from: currentUser, 
      to: currentRecipient,
      time: timestamp
    };
    
    setUsers(prev => ({
      ...prev,
      [currentUser]: [...prev[currentUser], newMsg],
      [currentRecipient]: [...prev[currentRecipient], newMsg]
    }));

    form.reset();
  };

  const renderMessages = () => {
    if (!currentUser || !currentRecipient) return null;

    const conv = users[currentUser].filter(
      (msg: Message) => (msg.from === currentUser && msg.to === currentRecipient) || 
             (msg.from === currentRecipient && msg.to === currentUser)
    );

    if (conv.length === 0) {
      return (
        <div className="empty-conv">
          <i className="fas fa-comments"></i>
          <p>Commencez la conversation avec {currentRecipient}</p>
        </div>
      );
    }

    return conv.map((msg: Message, index: number) => (
      <div key={index} className={`message ${msg.from === currentUser ? 'you' : 'other'}`}>
        <div className="message-text">{msg.text}</div>
        <div className="message-time">{formatTime(msg.time)}</div>
      </div>
    ));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto main-feed-content" style={{height: '100vh'}}>
        <div className="p-6" style={{height: '100%'}}>
          <div className="chat-container" style={{height: '100%'}}>
            {/* Chat sidebar */}
            <div className="chat-sidebar">
              <div 
                className={`user ${currentUser === 'lyna' ? 'active' : ''}`} 
                onClick={() => handleUserClick('lyna')}
              >
                <div className="user-avatar">L</div>
                <div className="user-info">
                  <div className="user-name">Mentor</div>
                  <div className="user-status">En ligne</div>
                </div>
                <span className="notif" id="notif-lyna"></span>
              </div>
              <div 
                className={`user ${currentUser === 'meriem' ? 'active' : ''}`}
                onClick={() => handleUserClick('meriem')}
              >
                <div className="user-avatar">M</div>
                <div className="user-info">
                  <div className="user-name">Accelerateur</div>
                  <div className="user-status">En ligne</div>
                </div>
                <span className="notif" id="notif-meriem"></span>
              </div>
            </div>

            {/* Chat area */}
            <div className="chat-main">
              <div className="chat-header">
                <div className="chat-header-avatar">
                  {currentRecipient ? currentRecipient.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  {currentRecipient ? `Conversation avec ${currentRecipient === 'lyna' ? 'Mentor' : 'Accelerateur'}` : 'Sélectionnez un utilisateur'}
                </div>
              </div>
              
              <div className="messages-container">
                <div className="messages">
                  {renderMessages()}
                </div>
              </div>
              
              <form className="input-area" onSubmit={handleSubmit}>
                <input 
                  type="text" 
                  name="message"
                  placeholder="Écrire un message..." 
                  required 
                />
                <button type="submit">
                  <FaPaperPlane /> Envoyer
                </button>
              </form>
            </div>
          </div>

          <style>{`
            html, body, #root {
              height: 100vh;
            }
            :root {
              --red: #e43e32;
              --light-gray: #f3f4f6;
              --dark: #1f2937;
              --sidebar-width: 280px;
             
            }

            * { 
              box-sizing: border-box;
              font-family: 'Segoe UI', sans-serif;
              margin: 0;
              padding: 0;
            }

            body {
              display: block;
              height: 100vh;
              width: 100%;
              background: var(--light-gray);
              color: var(--dark);
            }

            .main-feed-content {
              margin-left: 280px;
              min-height: calc(100vh - 70px);
              height: calc(100vh - 70px);
              width: 100%;
              background: #f9fafb;
              margin-top: 70px;
            }

            .p-6 {
              height: 100%;
              padding: 0;
            }

            .chat-container {
              display: flex;
              flex-direction: row;
              height: 100%;
              background: white;
              border-radius: 12px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              overflow: hidden;
            }

            .chat-sidebar {
              width: 280px;
              background: white;
              border-right: 1px solid #ddd;
              padding: 1rem;
              display: flex;
              flex-direction: column;
              overflow-y: auto;
            }

            .user {
              display: flex;
              align-items: center;
              gap: 1rem;
              padding: 0.75rem 1rem;
              margin-bottom: 0.5rem;
              background: #fff;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
              border: 1px solid transparent;
              transform-origin: left;
            }

            .user:hover {
              background: rgba(14, 108, 232, 0.18);
              border-color: rgba(80, 50, 228, 0.2);
              transform: translateX(5px);
            }

            .user.active {
              background:  rgba(14, 108, 232, 0.18);
              font-weight: bold;
              border-color: rgba(50, 103, 228, 0.3);
              transform: translateX(10px);
              box-shadow: 0 2px 4px rgba(228, 62, 50, 0.1);
            }

            .user-avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background-color:rgb(30, 47, 163);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              transition: transform 0.3s ease;
            }

            .user:hover .user-avatar {
              transform: scale(1.1);
            }

            .user.active .user-avatar {
              transform: scale(1.15);
              box-shadow: 0 0 0 2px rgba(89, 50, 228, 0.2);
            }

            .user-info {
              flex: 1;
            }

            .user-name {
              font-weight: 500;
            }

            .user-status {
              font-size: 0.75rem;
              color: #6b7280;
            }

            .notif {
              width: 12px;
              height: 12px;
              background: var(--red);
              border-radius: 50%;
              position: absolute;
              right: 12px;
              top: 12px;
              display: none;
            }

            .notif.active {
              display: block;
            }

            .chat-header {
              display: flex;
              align-items: center;
              gap: 1rem;
              padding: 0.75rem 1rem;
              background: white;
              border-bottom: 1px solid #e5e7eb;
              font-size: 1.25rem;
              font-weight: 600;
              min-height: 70px;
            }

            .chat-header-avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background-color:rgba(244, 25, 25, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
            }

            .messages-container {
              flex: 1 1 0%;
              min-height: 0;
              padding: 0.75rem 1rem;
              overflow-y: auto;
              background: #f9fafb;
              display: flex;
              justify-content: flex-end;
            }

            .messages {
              width: 100%;
              margin: 0;
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }

            .message {
              max-width: 70%;
              padding: 0.75rem 1rem;
              border-radius: 12px;
              position: relative;
              line-height: 1.4;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }

            .message.you {
              background: rgba(255, 0, 0, 0.65);
              color: white;
              align-self: flex-end;
              border-bottom-right-radius: 4px;
            }

            .message.other {
              background: #fff;
              align-self: flex-start;
              border-bottom-left-radius: 4px;
              border: 1px solid #e5e7eb;
            }

            .message-time {
              font-size: 0.75rem;
              opacity: 0.8;
              margin-top: 0.25rem;
              text-align: right;
            }

            .input-area {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 0.75rem;
              padding: 1rem 1.5rem;
              background: white;
              border-top: 1px solid #e5e7eb;
              margin-top: 16px;
            }

            .input-area input {
              flex: 1;
              padding: 0.75rem 1rem;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              outline: none;
              font-size: 1rem;
              transition: border 0.3s;
            }

            .input-area button {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              background: rgb(61, 201, 75);
              color: white;
              border: none;
              border-radius: 12px;
              padding: 0.75rem 2rem;
              font-weight: 500;
              font-size: 1rem;
              cursor: pointer;
              transition: background 0.3s, transform 0.2s;
              height: 48px;
            }

            .input-area button:hover {
              background:rgb(59, 59, 174);
              transform: translateY(-2px);
            }

            .empty-state {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              text-align: center;
              color: #6b7280;
            }

            .empty-state i {
              font-size: 3rem;
              margin-bottom: 1rem;
              color: #d1d5db;
            }

            .empty-state p {
              max-width: 300px;
              line-height: 1.5;
            }

            .empty-conv {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              text-align: center;
              color: #6b7280;
            }

            .empty-conv i {
              font-size: 3rem;
              margin-bottom: 1rem;
              color: #d1d5db;
            }

            .chat-main {
              flex: 1;
              display: flex;
              flex-direction: column;
              height: 100%;
              max-height: 600px;
              overflow-y: auto;
            }

            @media (max-width: 768px) {
              .main-feed-content {
                margin-left: 0;
              }
              .chat-container {
                flex-direction: column;
                height: calc(100vh - 80px);
              }
              .chat-sidebar {
                width: 100%;
                height: auto;
                max-height: 200px;
                border-right: none;
                border-bottom: 1px solid #ddd;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
