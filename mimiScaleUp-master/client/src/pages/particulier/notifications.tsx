import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { FaArrowLeft, FaBell, FaCheck, FaTrash, FaSearch, FaFilter, FaRegBell, FaRegCheckCircle, FaRegClock, FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category?: 'program' | 'meeting' | 'task' | 'resource' | 'general';
  priority?: 'high' | 'medium' | 'low';
}

const NotificationsPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Catégories et priorités
  const categories = [
    { id: 'all', label: 'Toutes', icon: FaRegBell },
    { id: 'program', label: 'Programme', icon: FaRegCheckCircle },
    { id: 'meeting', label: 'Réunions', icon: FaRegClock },
    { id: 'task', label: 'Tâches', icon: FaRegCheckCircle },
    { id: 'resource', label: 'Ressources', icon: FaRegBell },
    { id: 'general', label: 'Général', icon: FaRegBell }
  ];

  const priorities = [
    { id: 'all', label: 'Toutes' },
    { id: 'high', label: 'Haute' },
    { id: 'medium', label: 'Moyenne' },
    { id: 'low', label: 'Basse' }
  ];

  // Charger les notifications initiales
  useEffect(() => {
    const initialNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'Progression du programme',
        message: 'Vous avez complété 75% de votre programme d\'accélération',
        timestamp: new Date(Date.now() - 3600000),
        read: false,
        category: 'program',
        priority: 'high'
      },
      {
        id: '2',
        type: 'info',
        title: 'Nouvelle ressource disponible',
        message: 'Un nouveau guide sur le pitch deck est disponible dans la section Ressources',
        timestamp: new Date(Date.now() - 7200000),
        read: false,
        category: 'resource',
        priority: 'medium'
      },
      {
        id: '3',
        type: 'warning',
        title: 'Échéance approchante',
        message: 'La date limite pour soumettre votre rapport mensuel est dans 2 jours',
        timestamp: new Date(Date.now() - 86400000),
        read: false,
        category: 'task',
        priority: 'high'
      },
      {
        id: '4',
        type: 'info',
        title: 'Réunion programmée',
        message: 'Une réunion avec votre mentor est prévue demain à 14h',
        timestamp: new Date(Date.now() - 172800000),
        read: true,
        category: 'meeting',
        priority: 'medium'
      },
      {
        id: '5',
        type: 'success',
        title: 'Tâche complétée',
        message: 'Votre business plan a été validé par le comité',
        timestamp: new Date(Date.now() - 259200000),
        read: true,
        category: 'task',
        priority: 'low'
      }
    ];

    setNotifications(initialNotifications);
    setUnreadCount(initialNotifications.filter(n => !n.read).length);
  }, []);

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || notification.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || notification.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Actions sur les notifications
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  // Styles dynamiques
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-500';
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'program': return 'bg-purple-100 text-purple-800';
      case 'meeting': return 'bg-sky-100 text-sky-800';
      case 'task': return 'bg-amber-100 text-amber-800';
      case 'resource': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header élégant avec effet de verre */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setLocation('/particulier/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-all duration-300 group"
            >
              <FaArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Dashboard</span>
            </button>
            
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setLocation('/particulier/profile')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-all duration-300"
              >
                <FaUser className="h-5 w-5" />
                <span className="font-medium">Profil</span>
              </button>
              <div className="relative">
                <FaBell className="text-gray-500 text-xl hover:text-gray-700 transition-colors cursor-pointer" />
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </div>
              <button
                onClick={markAllAsRead}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Tout marquer comme lu
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-700">
              Notifications
            </h1>
            <p className="mt-2 text-gray-600">Restez informé de toutes vos activités</p>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Barre de recherche et filtres avec effet de verre */}
        <div className="mb-8 bg-white/80 backdrop-blur-lg rounded-xl shadow-sm p-6 border border-gray-200/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher des notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm shadow-sm transition-all duration-200 bg-white/50"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <FaFilter className="text-gray-500" />
                  <span className="text-sm font-medium">Filtrer</span>
                </button>
                
                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-lg rounded-lg shadow-lg z-10 border border-gray-200"
                    >
                      <div className="p-2">
                        <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</h3>
                        {categories.map(category => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`w-full text-left px-3 py-2.5 text-sm rounded-md flex items-center gap-3 ${
                              selectedCategory === category.id 
                                ? 'bg-red-50 text-red-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                            } transition-all duration-200`}
                          >
                            <category.icon className={`w-4 h-4 ${selectedCategory === category.id ? 'text-red-600' : 'text-gray-500'}`} />
                            {category.label}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 p-2">
                        <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priorité</h3>
                        {priorities.map(priority => (
                          <button
                            key={priority.id}
                            onClick={() => setSelectedPriority(priority.id)}
                            className={`w-full text-left px-3 py-2.5 text-sm rounded-md ${
                              selectedPriority === priority.id 
                                ? 'bg-red-50 text-red-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                            } transition-all duration-200`}
                          >
                            {priority.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des notifications avec animations */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            <AnimatePresence>
              {filteredNotifications.map(notification => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border-l-4 ${
                    !notification.read 
                      ? 'border-red-500 shadow-md' 
                      : 'border-transparent'
                  } transition-all duration-200 hover:shadow-md hover:bg-white`}
                >
                  <div className="p-5">
                    <div className="flex justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`mt-1 flex-shrink-0 h-3 w-3 rounded-full ${getTypeColor(notification.type)}`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className={`text-lg font-medium ${
                              !notification.read 
                                ? 'text-gray-900' 
                                : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            <div className="flex space-x-2">
                              {notification.category && (
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getCategoryColor(notification.category)}`}>
                                  {categories.find(c => c.id === notification.category)?.label}
                                </span>
                              )}
                              {notification.priority && (
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                                  {notification.priority}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className={`mt-2 ${
                            !notification.read 
                              ? 'text-gray-600' 
                              : 'text-gray-500'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {formatDate(notification.timestamp)}
                            </span>
                            <div className="flex space-x-3">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                                  title="Marquer comme lu"
                                >
                                  <FaCheck className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                                title="Supprimer"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-8 text-center border border-gray-200/50"
            >
              <div className="mx-auto h-24 w-24 bg-gray-100/50 rounded-full flex items-center justify-center mb-4">
                <FaBell className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune notification</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all' || selectedPriority !== 'all'
                  ? 'Aucune notification ne correspond à vos critères de recherche.'
                  : 'Vous êtes à jour, aucune nouvelle notification pour le moment.'}
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;