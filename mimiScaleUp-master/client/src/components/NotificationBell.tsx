import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { useNotifications } from '@/context/NotificationContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [markingRead, setMarkingRead] = useState<number | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading, fetchNotifications } = useNotifications();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Debug effect removed for production

  // Force refresh notifications only when bell is first opened
  useEffect(() => {
    if (isOpen) {
      // Use a timeout to prevent multiple refreshes
      const refreshTimeout = setTimeout(() => {
        fetchNotifications();
      }, 100); // Small delay to prevent multiple refreshes

      return () => clearTimeout(refreshTimeout);
    }
  }, [isOpen]); // fetchNotifications intentionally not in dependency array

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the notification item click event
    setMarkingRead(id);
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setMarkingRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  // Handle notification clicks for form access and team notifications
  const handleNotificationClick = (notification: any) => {
    // Handle form access notifications
    if (notification.type === 'form_access' && notification.related_id) {
      // Determine the correct URL based on user role
      const formUrl = user?.role === 'startup'
        ? `/startup/apply/${notification.related_id}`
        : `/particulier/apply/${notification.related_id}`;

      // Navigate to the form
      setLocation(formUrl);

      // Mark the notification as read
      markAsRead(notification.id);

      // Close the notification dropdown
      setIsOpen(false);
    }

    // Handle team creation or team addition notifications
    else if (notification.type === 'team_creation' || notification.type === 'team_addition') {
      // Mark the notification as read
      markAsRead(notification.id);

      // Close the notification dropdown
      setIsOpen(false);

      // The TeamNotificationHandler component will automatically show the popup
      // when it detects an unread team notification
    }
  };

  return (
    <div className="notification-bell-container">
      <div
        className="notification-bell"
        onClick={toggleNotifications}
        role="button"
        tabIndex={0}
        aria-label="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button
                className={`mark-all-read-btn ${markingAllRead ? 'loading' : ''}`}
                onClick={handleMarkAllAsRead}
                disabled={markingAllRead || loading}
              >
                {markingAllRead ? 'Traitement...' : 'Tout marquer comme lu'}
              </button>
            )}
          </div>

          <ScrollArea className="notification-list-container">
            <div className="notification-list">
              {loading ? (
                <div className="notification-loading">Chargement...</div>
              ) : notifications.length === 0 ? (
                <div className="no-notifications">Aucune notification</div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''} ${notification.type === 'form_access' || notification.type === 'team_creation' || notification.type === 'team_addition' ? 'clickable' : ''}`}
                    onClick={() => (notification.type === 'form_access' || notification.type === 'team_creation' || notification.type === 'team_addition') ? handleNotificationClick(notification) : null}
                  >
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-date">{formatDate(notification.created_at)}</div>
                    </div>
                    <button
                      className={`mark-read-btn ${notification.is_read ? 'read' : ''} ${markingRead === notification.id ? 'loading' : ''}`}
                      onClick={(e) => !notification.is_read && handleMarkAsRead(notification.id, e)}
                      disabled={notification.is_read || markingRead === notification.id}
                      title={notification.is_read ? "Déjà lu" : "Marquer comme lu"}
                    >
                      {notification.is_read ? (
                        <FaCheckDouble className="check-icon" />
                      ) : markingRead === notification.id ? (
                        <div className="spinner"></div>
                      ) : (
                        <FaCheck className="check-icon" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      <style>{`
        .notification-bell-container {
          position: relative;
          z-index: 1001; /* Ensure it's above other elements */
        }

        .notification-bell {
          position: relative;
          cursor: pointer;
          font-size: 1.2rem;
          color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #e43e32;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: -20px;
          width: 550px;
          max-height: 600px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          margin-top: 10px;
          overflow: hidden;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #eee;
          background-color: #f8f9fa;
        }

        .notification-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }

        .mark-all-read-btn {
          background: none;
          border: none;
          color: #0c4c80;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 5px 10px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .mark-all-read-btn:hover {
          background-color: rgba(12, 76, 128, 0.1);
        }

        .mark-all-read-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mark-all-read-btn.loading {
          position: relative;
          color: transparent;
        }

        .mark-all-read-btn.loading::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          top: 50%;
          left: 50%;
          margin-top: -8px;
          margin-left: -8px;
          border-radius: 50%;
          border: 2px solid rgba(12, 76, 128, 0.3);
          border-top-color: #0c4c80;
          animation: spin 0.8s linear infinite;
        }

        .notification-list-container {
          max-height: 500px;
        }

        .notification-list {
          width: 100%;
        }

        .notification-item {
          padding: 15px;
          border-bottom: 1px solid #eee;
          transition: background-color 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .notification-item:hover {
          background-color: #f9f9f9;
        }

        .notification-item.unread {
          background-color: #f0f7ff;
        }

        .notification-item.clickable {
          cursor: pointer;
        }

        .notification-item.clickable:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .notification-content {
          flex: 1;
          margin-right: 15px;
          min-width: 0; /* This helps with text overflow in flex containers */
          max-width: calc(100% - 40px); /* Account for the mark-read button */
        }

        .notification-title {
          font-weight: 600;
          margin-bottom: 5px;
          color: #333;
        }

        .notification-message {
          font-size: 0.9rem;
          color: #555;
          margin-bottom: 5px;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
          width: 100%;
        }

        .notification-date {
          font-size: 0.8rem;
          color: #888;
        }

        .mark-read-btn {
          background: none;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #0c4c80;
          background-color: rgba(12, 76, 128, 0.1);
          transition: all 0.2s;
          flex-shrink: 0;
          margin-top: 5px;
        }

        .mark-read-btn:hover {
          background-color: rgba(12, 76, 128, 0.2);
        }

        .mark-read-btn.read {
          background-color: rgba(0, 128, 0, 0.1);
          color: green;
          cursor: default;
        }

        .mark-read-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .check-icon {
          font-size: 14px;
        }

        .mark-read-btn.loading {
          position: relative;
          color: transparent;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(12, 76, 128, 0.3);
          border-top-color: #0c4c80;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .notification-loading,
        .no-notifications {
          padding: 20px;
          text-align: center;
          color: #666;
        }

        @media (max-width: 768px) {
          .notification-dropdown {
            width: 95vw;
            max-width: 550px;
            right: -100px;
            left: auto;
            transform: none;
          }

          .notification-item {
            padding: 12px;
          }

          .notification-message {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 576px) {
          .notification-dropdown {
            width: 95vw;
            max-width: 550px;
            right: -150px;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
