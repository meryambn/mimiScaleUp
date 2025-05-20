import React, { useState, useEffect } from 'react';
import {
  FaCalendarAlt,
  FaClock,
  FaUserFriends,
  FaVideo,
  FaChevronRight,
  FaPlus,
  FaTimes,
  FaBell,
  FaEllipsisV
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/sidebar';
import ProgramPhaseTimeline from '@/components/widgets/ProgramPhaseTimeline';
import CalendarView from '@/components/meetings/CalendarView';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  ListFilter,
  Search,
  List,
} from "lucide-react";
import { useProgramContext } from '@/context/ProgramContext';
import { useMeetings } from '@/context/MeetingsContext';

const StartupMeetingsPage = () => {
  const { selectedProgram, selectedPhaseId, setSelectedPhaseId } = useProgramContext();
  const {
    upcomingMeetings,
    pastMeetings,
    searchQuery,
    setSearchQuery,
    formatDate,
    formatTime,
    formatAttendees
  } = useMeetings();
  const [activePhase, setActivePhase] = useState(selectedPhaseId || 1);
  const [activeView, setActiveView] = useState<"list" | "calendar">("list");
  const [viewTab, setViewTab] = useState<"upcoming" | "past">("upcoming");
  const [isLoading, setIsLoading] = useState(true);

  // Filter meetings based on availability and phase
  const filterMeetingsByPhase = (meetings: any[]) => {
    return meetings.filter(meeting => meeting.phaseId === activePhase);
  };

  const availableMeetings = filterMeetingsByPhase(upcomingMeetings.filter(meeting => meeting.isOnline));
  const unavailableMeetings = filterMeetingsByPhase(upcomingMeetings.filter(meeting => !meeting.isOnline));
  const allPastMeetings = filterMeetingsByPhase([...pastMeetings, ...unavailableMeetings]);

  // Update active phase when selectedPhaseId changes
  useEffect(() => {
    if (selectedPhaseId) {
      setActivePhase(selectedPhaseId);
    }
  }, [selectedPhaseId]);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [availableMeetings, allPastMeetings]);

  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [sidebarActive, setSidebarActive] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    time: '10:00',
    duration: '60',
    participants: [] as string[]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewMeeting(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    // Logique pour créer la réunion
    setShowNewMeetingModal(false);
    setNewMeeting({
      title: '',
      date: '',
      time: '10:00',
      duration: '60',
      participants: []
    });
  };

  const handlePhaseChange = (phase: number) => {
    setActivePhase(phase);
    setSelectedPhaseId(phase); // Update program context when phase changes
  };

  // Get phase description
  const getPhaseDescription = (phaseId: number) => {
    if (selectedProgram && selectedProgram.phases) {
      const phase = selectedProgram.phases.find(p => p.id === phaseId);
      if (phase) {
        return phase.description;
      }
    }
    return "Description non disponible";
  };

  return (
    <div className="meetings-container">
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="meetings-header">
          <div>
            <h1>Réunions - {selectedProgram?.name || 'Programme'}</h1>
            <p className="subtitle">Vos sessions de collaboration par phase</p>
          </div>
          <div className="flex space-x-2">
            <div className="flex bg-muted rounded-md p-1">
              <button
                onClick={() => setActiveView("list")}
                className="rounded-sm"
                style={{
                  backgroundColor: activeView === "list" ? '#0c4c80' : 'transparent',
                  color: activeView === "list" ? 'white' : '#0c4c80',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <List className="h-4 w-4" />
                Liste
              </button>
              <button
                onClick={() => setActiveView("calendar")}
                className="rounded-sm"
                style={{
                  backgroundColor: activeView === "calendar" ? '#0c4c80' : 'transparent',
                  color: activeView === "calendar" ? 'white' : '#0c4c80',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CalendarDays className="h-4 w-4" />
                Calendrier
              </button>
            </div>
          </div>
        </header>

        {/* Phases Navigation */}
        <section className="phases-section">
          <ProgramPhaseTimeline
            phases={selectedProgram?.phases || []}
            selectedPhase={activePhase}
            onPhaseChange={handlePhaseChange}
            title="Chronologie des phases"
            description={getPhaseDescription(activePhase)}
          />
        </section>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={`Rechercher des réunions pour la phase ${activePhase}...`}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              style={{
                backgroundColor: 'white',
                color: '#0c4c80',
                border: '1px solid #e5e7eb',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ListFilter className="h-4 w-4 mr-2" />
              Filtrer
            </button>
          </div>
        </div>

        {/* Meeting Content */}
        {activeView === "calendar" ? (
          <CalendarView
            meetings={[...availableMeetings, ...allPastMeetings]}
            getPhaseById={(phaseId) => selectedProgram?.phases?.find(p => p.id === Number(phaseId))}
          />
        ) : (
          <Tabs defaultValue="upcoming" onValueChange={(value) => setViewTab(value as "upcoming" | "past")}>
            <TabsList className="mb-6">
              <TabsTrigger value="upcoming">
                Réunions à venir - Phase {activePhase} ({availableMeetings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Réunions passées - Phase {activePhase} ({allPastMeetings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <section className="meetings-list">
                <AnimatePresence>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : availableMeetings.length > 0 ? (
                    availableMeetings.map(meeting => (
                      <motion.div
                        key={meeting.id}
                        className="meeting-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ y: -5 }}
                      >
                        <div className="card-header">
                          <h3 className="meeting-title">{meeting.title}</h3>
                          <div className="card-actions">
                            <button className="icon-btn">
                              <FaBell />
                            </button>
                            <button className="icon-btn">
                              <FaEllipsisV />
                            </button>
                          </div>
                        </div>

                        <div className="meeting-details">
                          <div className="detail">
                            <FaCalendarAlt className="icon" />
                            <span>{formatDate(meeting.date)}</span>
                          </div>

                          <div className="detail">
                            <FaClock className="icon" />
                            <span>{formatTime(meeting.time)}</span>
                          </div>

                          <div className="detail">
                            <FaUserFriends className="icon" />
                            <span>{formatAttendees(meeting.attendees)}</span>
                          </div>
                        </div>

                        <div className="card-footer">
                          <motion.button
                            className="secondary-btn"
                            onClick={() => setSelectedMeeting(meeting)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            Détails <FaChevronRight />
                          </motion.button>
                          <motion.button
                            className="primary-btn"
                            whileHover={{ scale: 1.03, boxShadow: "0 2px 10px rgba(228, 62, 50, 0.3)" }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <FaVideo /> Rejoindre
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>Aucune réunion disponible pour cette phase</p>
                      <motion.button
                        className="primary-btn"
                        onClick={() => setShowNewMeetingModal(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaPlus /> Planifier une réunion
                      </motion.button>
                    </div>
                  )}
                </AnimatePresence>
              </section>
            </TabsContent>

            <TabsContent value="past">
              <section className="meetings-list">
                <AnimatePresence>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : allPastMeetings.length > 0 ? (
                    allPastMeetings.map(meeting => (
                      <motion.div
                        key={meeting.id}
                        className="meeting-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ y: -5 }}
                      >
                        <div className="card-header">
                          <h3 className="meeting-title">{meeting.title}</h3>
                          <div className="card-actions">
                            <button className="icon-btn">
                              <FaBell />
                            </button>
                            <button className="icon-btn">
                              <FaEllipsisV />
                            </button>
                          </div>
                        </div>

                        <div className="meeting-details">
                          <div className="detail">
                            <FaCalendarAlt className="icon" />
                            <span>{formatDate(meeting.date)}</span>
                          </div>

                          <div className="detail">
                            <FaClock className="icon" />
                            <span>{formatTime(meeting.time)}</span>
                          </div>

                          <div className="detail">
                            <FaUserFriends className="icon" />
                            <span>{formatAttendees(meeting.attendees)}</span>
                          </div>
                        </div>

                        <div className="card-footer">
                          <motion.button
                            className="secondary-btn"
                            onClick={() => setSelectedMeeting(meeting)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            Détails <FaChevronRight />
                          </motion.button>
                          <motion.button
                            className="primary-btn"
                            disabled={true}
                            style={{ backgroundColor: '#9ca3af', cursor: 'not-allowed' }}
                          >
                            <FaVideo /> {meeting.isOnline ? 'Terminée' : 'Indisponible'}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>Aucune réunion passée pour cette phase</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Les réunions passées et indisponibles apparaîtront ici.
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </section>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* New Meeting Modal */}
      <AnimatePresence>
        {showNewMeetingModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewMeetingModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-btn"
                onClick={() => setShowNewMeetingModal(false)}
              >
                <FaTimes />
              </button>

              <h2>Nouvelle réunion (Phase {activePhase})</h2>

              <form onSubmit={handleCreateMeeting}>
                <div className="form-group">
                  <label>Titre de la réunion</label>
                  <input
                    type="text"
                    name="title"
                    value={newMeeting.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={newMeeting.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Heure</label>
                    <input
                      type="time"
                      name="time"
                      value={newMeeting.time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Durée (minutes)</label>
                  <select
                    name="duration"
                    value={newMeeting.duration}
                    onChange={handleInputChange}
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 heure</option>
                    <option value="90">1 heure 30</option>
                    <option value="120">2 heures</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Participants (séparés par des virgules)</label>
                  <input
                    type="text"
                    name="participants"
                    value={newMeeting.participants.join(', ')}
                    onChange={(e) => setNewMeeting(prev => ({
                      ...prev,
                      participants: e.target.value.split(',').map(p => p.trim())
                    }))}
                  />
                </div>

                <div className="form-actions">
                  <motion.button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowNewMeetingModal(false)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Annuler
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="primary-btn"
                    whileHover={{ scale: 1.03, boxShadow: "0 2px 10px rgba(228, 62, 50, 0.3)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Créer la réunion
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meeting Detail Modal */}
      <AnimatePresence>
        {selectedMeeting && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMeeting(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-btn"
                onClick={() => setSelectedMeeting(null)}
              >
                <FaTimes />
              </button>

              <div className="modal-header">
                <span className={`meeting-type ${selectedMeeting.type.toLowerCase()}`}>
                  {selectedMeeting.type}
                </span>
                <h2>{selectedMeeting.title}</h2>
                <p>Phase {activePhase}</p>
              </div>

              <div className="modal-body">
                <div className="detail-group">
                  <FaCalendarAlt className="icon" />
                  <div>
                    <h4>Date</h4>
                    <p>{formatDate(selectedMeeting.date)}</p>
                  </div>
                </div>

                <div className="detail-group">
                  <FaClock className="icon" />
                  <div>
                    <h4>Heure</h4>
                    <p>{formatTime(selectedMeeting.time)}</p>
                  </div>
                </div>

                <div className="detail-group">
                  <FaUserFriends className="icon" />
                  <div>
                    <h4>Participants</h4>
                    <p>{formatAttendees(selectedMeeting.attendees)}</p>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <motion.button
                  className="secondary-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Modifier
                </motion.button>
                <motion.button
                  className="primary-btn"
                  disabled={!selectedMeeting.isOnline}
                  whileHover={selectedMeeting.isOnline ? {
                    scale: 1.03,
                    boxShadow: "0 2px 10px rgba(228, 62, 50, 0.3)"
                  } : {}}
                  whileTap={selectedMeeting.isOnline ? { scale: 0.97 } : {}}
                >
                  <FaVideo /> {selectedMeeting.isOnline ? 'Rejoindre' : 'Indisponible'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS Styles */}
      <style jsx>{`
        .meetings-container {
          display: flex;
          min-height: 100vh;
          background-color: #f9fafb;
          position: relative;
        }

        .main-content {
          flex: 1;
          padding: 2rem;
          padding-top: 100px; /* Add padding to account for the navbar height */
          margin-left: 280px;
          min-height: 100vh;
        }

        .meetings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .meetings-header h1 {
          font-size: 1.3rem;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .subtitle {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }

        .primary-btn {
          background: var(--gradient);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-btn:hover {
          background: var(--gradient);
          opacity: 0.9;
        }

        .primary-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        /* Phases Navigation */
        .phases-section {
          margin-bottom: 1.5rem;
        }

        /* Meetings List */
        .meetings-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .meeting-card {
          background: white;
          border-radius: 8px;
          padding: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border-left: 4px solid #e43e32;
        }

        .meeting-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .meeting-type {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .meeting-type.équipe {
          background: rgba(228, 62, 50, 0.1);
          color: #e43e32;
        }

        .meeting-type.client {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .meeting-type.développement {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .meeting-type.validation {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .meeting-type.clôture {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.25rem;
          font-size: 1rem;
        }

        .meeting-title {
          font-size: 1.25rem;
          color: #111827;
          margin: 0 0 1rem 0;
        }

        .meeting-details {
          margin: 1rem 0;
        }

        .detail {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
          color: #4a5568;
          font-size: 0.95rem;
        }

        .icon {
          margin-right: 0.75rem;
          color: #9ca3af;
          min-width: 20px;
        }

        .card-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .secondary-btn {
          background: none;
          color: #e43e32;
          border: 1px solid #e43e32;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .secondary-btn:hover {
          background: rgba(228, 62, 50, 0.1);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          width: 90%;
          max-width: 500px;
          position: relative;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0.25rem;
        }

        .modal-content h2 {
          margin-top: 0;
          color: #111827;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #4b5563;
          font-weight: 100;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .form-row .form-group {
          flex: 1;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }

        /* Detail Modal Styles */
        .modal-header {
          margin-bottom: 1.5rem;
        }

        .modal-header h2 {
          margin-bottom: 0.5rem;
        }

        .modal-header p {
          color: #6b7280;
          margin: 0;
          font-size: 0.9rem;
        }

        .modal-body {
          margin: 2rem 0;
        }

        .detail-group {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: flex-start;
        }

        .detail-group .icon {
          font-size: 1.25rem;
          margin-top: 0.25rem;
        }

        .detail-group h4 {
          margin: 0 0 0.25rem 0;
          color: #4b5563;
          font-size: 0.9rem;
        }

        .detail-group p {
          margin: 0;
          color: #111827;
          font-size: 1rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 1rem;
            padding-top: 100px; /* Maintain padding for navbar on mobile */
          }

          .meetings-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .card-footer {
            flex-direction: column;
          }

          .primary-btn, .secondary-btn {
            width: 100%;
            justify-content: center;
          }

          .form-row {
            flex-direction: column;
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default StartupMeetingsPage;