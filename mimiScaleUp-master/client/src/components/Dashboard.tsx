import React, { useState } from 'react';
import {
  FaUsers,
  FaCalendarAlt,
  FaTasks,
  FaCheckCircle,
  FaSpinner,
  FaTimesCircle,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaAward,
  FaLightbulb,
  FaComments
} from 'react-icons/fa';
import ProgramTimelineWidget from '@/components/widgets/ProgramTimelineWidget';
import ProgramDetailsWidget from '@/components/widgets/ProgramDetailsWidget';

const Dashboard = () => {
  const [activePhase, setActivePhase] = useState(1);
  const [sidebarActive, setSidebarActive] = useState(false);
  const mentors = [
    {
      id: 1,
      name: "lyna arezki",
      expertise: "Développement Web",
      experience: "1 ans",
      rating: 5,
    }
  ];

  // Données simulées
  const statsData = {
    teamMembers: { value: 8, change: +2 },
    meetingsCompleted: { value: 24, change: +5 },
    tasks: { completed: 15, pending: 7 },
    funding: { amount: "10K DA", target: "1000K DA" },
    kpis: [
      { name: "Satisfaction", value: 82, unit: "%", trend: "up" },
      { name: "Engagement", value: 67, unit: "%", trend: "up" },
      { name: "Retention", value: 91, unit: "%", trend: "stable" }
    ]
  };

  const upcomingMeetings = [
    { title: "Révision hebdomadaire", time: "10:00 AM", type: "Equipe", participants: 5 },
    { title: "Mentorat stratégique", time: "04:00 PM", type: "mentor", participants: 2 }
  ];

  const recentActivities = [
    { type: "task", text: "Business plan validé", time: "Il y a 2 heures", icon: <FaCheckCircle /> },
    { type: "meeting", text: "Réunion avec les investisseurs", time: "Hier", icon: <FaComments /> },
    { type: "milestone", text: "MVP lancé", time: "Il y a 3 jours", icon: <FaAward /> },
    { type: "idea", text: "Nouvelle fonctionnalité proposée", time: "Il y a 5 jours", icon: <FaLightbulb /> }
  ];

  // Critères d'évaluation par phase
  const phaseEvaluationCriteria = {
    1: [
      { name: "Dossier complet soumis", status: "fulfilled", stars: 5 },
      { name: "Présentation pitch", status: "fulfilled", stars: 4 },
      { name: "Entretien avec le jury", status: "fulfilled", stars: 5 },
      { name: "Validation comité", status: "fulfilled", stars: 5 }
    ],
    2: [
      { name: "MVP développé", status: "fulfilled", stars: 4 },
      { name: "Test utilisateur", status: "fulfilled", stars: 3 },
      { name: "Levée de fonds", status: "pending", stars: 2 },
      { name: "Recrutement équipe", status: "pending", stars: 1 },
      { name: "Stratégie marketing", status: "pending", stars: 1 }
    ],
    3: [
      { name: "Mentorat technique", status: "pending", stars: 0 },
      { name: "Mentorat business", status: "pending", stars: 0 },
      { name: "Réseautage", status: "not-met", stars: 0 },
      { name: "Préparation scaling", status: "not-met", stars: 0 }
    ],
    4: [
      { name: "Chiffre d'affaires", status: "not-met", stars: 0 },
      { name: "Utilisateurs actifs", status: "not-met", stars: 0 },
      { name: "Levée de fonds finale", status: "not-met", stars: 0 },
      { name: "Perspective croissance", status: "not-met", stars: 0 }
    ]
  };

  const phaseDescriptions = {
    1: "Phase de sélection et validation du projet",
    2: "Développement accéléré et recherche de financement",
    3: "Accompagnement par des mentors experts",
    4: "Présentation des résultats et perspectives"
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarActive(!sidebarActive)}
      >
        ☰
      </button>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1>Programme ScaleUp</h1>
            <p className="subtitle">Tableau de bord de votre startup</p>
          </div>
          <div className="date-range">
            <span>Phase {activePhase} en cours</span>
            <span>{phaseDescriptions[activePhase]}</span>
          </div>
        </header>

        {/* Program Details Widget */}
        <section className="program-details-section">
          <h2>Détails du Programme</h2>
          <div className="program-details-container">
            <ProgramDetailsWidget isStartupInterface={true} />
          </div>
        </section>

        {/* Program Timeline Widget */}
        <section className="timeline-section">
          <h2>Progression du Programme</h2>
          <div className="timeline-container">
            <ProgramTimelineWidget onPhaseSelect={(phaseId) => setActivePhase(Number(phaseId))} />
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FaUsers />
            </div>
            <div className="stat-content">
              <h3>Équipe</h3>
              <div className="stat-value">{statsData.teamMembers.value}</div>
              <div className={`stat-change ${statsData.teamMembers.change > 0 ? 'positive' : 'negative'}`}>
                {statsData.teamMembers.change > 0 ? <FaArrowUp /> : <FaArrowDown />}
                {Math.abs(statsData.teamMembers.change)} membres
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaCalendarAlt />
            </div>
            <div className="stat-content">
              <h3>Réunions</h3>
              <div className="stat-value">{statsData.meetingsCompleted.value}</div>
              <div className={`stat-change ${statsData.meetingsCompleted.change > 0 ? 'positive' : 'negative'}`}>
                {statsData.meetingsCompleted.change > 0 ? <FaArrowUp /> : <FaArrowDown />}
                {Math.abs(statsData.meetingsCompleted.change)} ce mois
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaTasks />
            </div>
            <div className="stat-content">
              <h3>Tâches</h3>
              <div className="stat-value">{statsData.tasks.completed + statsData.tasks.pending}</div>
              <div className="task-progress">
                <div className="progress-labels">
                  <span>{statsData.tasks.completed} terminées</span>
                  <span>{statsData.tasks.pending} en attente</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${(statsData.tasks.completed / (statsData.tasks.completed + statsData.tasks.pending)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs and Meetings Section */}
        <section className="content-section">
          <div className="activities-section">
            <h2>Votre mentor :</h2>
            <div className="mentors-list">
              {mentors.map((mentor) => (
                <div key={mentor.id} className="mentor-card">
                  <div className="mentor-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="mentor-info">
                    <h3>{mentor.name}</h3>
                    <div className="mentor-expertise">
                      <span>Expertise: </span>
                      {mentor.expertise}
                    </div>
                    <div className="mentor-experience">
                      <span>Expérience: </span>
                      {mentor.experience}
                    </div>
                    <div className="mentor-rating">
                      <span>Note: </span>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(mentor.rating) ? 'star-filled' : 'star-empty'}>
                          {i < Math.floor(mentor.rating) ? '★' : '☆'}
                        </span>
                      ))}
                      <span className="rating-value">({mentor.rating})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="meetings-card">
            <h2>Prochaines Réunions</h2>
            <div className="meeting-list">
              {upcomingMeetings.map((meeting, index) => (
                <div key={index} className="meeting-item">
                  <div className="meeting-type">{meeting.type === "team" ? "Équipe" : meeting.type === "client" ? "Client" : "Mentor"}</div>
                  <div className="meeting-details">
                    <div className="meeting-title">{meeting.title}</div>
                    <div className="meeting-time">{meeting.time} • {meeting.participants} participants</div>
                  </div>
                  <button className="meeting-join">Rejoindre</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Evaluation and Activities Section */}
        <section className="content-section">
          <div className="evaluation-section">
            <h2>Critères d'évaluation - Phase {activePhase}</h2>
            <div className="criteria-container">
              {phaseEvaluationCriteria[activePhase].map((criteria, index) => (
                <div key={index} className={`criteria-item ${criteria.status}`}>
                  <div className="criteria-status">
                    {criteria.status === 'fulfilled' && <FaCheckCircle />}
                    {criteria.status === 'pending' && <FaSpinner className="spin" />}
                    {criteria.status === 'not-met' && <FaTimesCircle />}
                  </div>
                  <span className="criteria-name">{criteria.name}</span>
                  <div className="star-rating">
                    {[...Array(5)].map((_, starIndex) => (
                      <span
                        key={starIndex}
                        className={starIndex < criteria.stars ? 'active' : ''}
                      >
                        &#9733;
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="activities-section">
            <h2>Activités Récentes</h2>
            <div className="activities-list">
              {recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <div className="activity-text">{activity.text}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background-color: #f9fafb;
        }

        .main-content {
          flex: 1;
          padding: 2rem;
          padding-top: 100px; /* Add padding to account for the navbar height */
          position: relative;
          margin-left: 280px;
          min-height: 100vh;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .subtitle {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }

        .date-range {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          color: #6b7280;
          font-size: 0.9rem;
        }

        /* Phases Section */
        .phases-section, .timeline-section, .program-details-section {
          margin-bottom: 2rem;
        }

        .phases-section h2, .timeline-section h2, .program-details-section h2 {
          font-size: 1.5rem;
          color: #111827;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .timeline-container, .program-details-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .phases-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .phase-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.3s ease;
          border-left: 4px solid #e5e7eb;
        }

        .phase-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        }

        .phase-card.active {
          border-left-color: #e43e32;
          background-color: rgba(228, 62, 50, 0.05);
          box-shadow: 0 10px 15px rgba(228, 62, 50, 0.1);
        }

        .phase-number {
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .phase-name {
          font-size: 1.2rem;
          color: #374151;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .phase-progress {
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background-color: #e43e32;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .phase-status {
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
        }

        .status-completed {
          color: #10b981;
        }

        .status-in-progress {
          color: #f59e0b;
        }

        .status-upcoming {
          color: #6b7280;
        }

        .spin {
          animation: spin 2s linear infinite;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: rgba(228, 62, 50, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e43e32;
          font-size: 1.25rem;
        }

        .stat-content {
          flex: 1;
        }

        .stat-content h3 {
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .stat-change {
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .stat-change.positive {
          color: #10b981;
        }

        .stat-change.negative {
          color: #ef4444;
        }

        .task-progress {
          margin-top: 0.75rem;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .progress-bar-container {
          height: 6px;
          background-color: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        /* Content Section */
        .content-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 1200px) {
          .content-section {
            grid-template-columns: 1fr;
          }
        }

        .meetings-card, .evaluation-section, .activities-section {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .meetings-card h2, .evaluation-section h2, .activities-section h2 {
          font-size: 1.25rem;
          color: #111827;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        /* Meetings List */
        .meeting-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .meeting-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 8px;
          background-color: #f9fafb;
          transition: all 0.3s ease;
        }

        .meeting-item:hover {
          background-color: #f3f4f6;
        }

        .meeting-type {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .meeting-details {
          flex: 1;
        }

        .meeting-title {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .meeting-time {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .meeting-join {
          background: var(--gradient);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .meeting-join:hover {
          background: var(--gradient);
          opacity: 0.9;
        }

        /* Evaluation Section */
        .criteria-container {
          display: grid;
          gap: 0.75rem;
        }

        .criteria-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 8px;
          font-weight: 500;
          background-color: #f9fafb;
        }

        .criteria-item.fulfilled {
          background-color: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .criteria-item.pending {
          background-color: rgba(249, 115, 22, 0.1);
          color: #f97316;
        }

        .criteria-item.not-met {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .criteria-status {
          font-size: 1.25rem;
        }

        .criteria-name {
          flex: 1;
        }

        .star-rating {
          display: flex;
          gap: 0.25rem;
          color: #d1d5db;
          font-size: 1.1rem;
        }

        .star-rating .active {
          color: #fbbf24;
        }

        /* Activities Section */
        .activities-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          border-radius: 8px;
          background-color: #f9fafb;
          transition: all 0.3s ease;
        }

        .activity-item:hover {
          background-color: #f3f4f6;
        }

        .activity-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: rgba(228, 62, 50, 0.1);
          color: #e43e32;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
        }

        .activity-text {
          font-weight: 500;
          color: #111827;
          margin-bottom: 0.1rem;
        }

        .activity-time {
          font-size: 0.8rem;
          color: #6b7280;
        }

        /* Mentor Section */
        .mentors-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .mentor-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .mentor-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          margin: 0 auto 1rem;
          border: 3px solid #f3f4f6;
          color: #6b7280;
        }

        .mentor-info {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .mentor-info h3 {
          font-size: 1.2rem;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .mentor-expertise,
        .mentor-experience,
        .mentor-rating {
          font-size: 0.9rem;
          color: #6b7280;
          margin-bottom: 0.3rem;
        }

        .mentor-expertise span,
        .mentor-experience span,
        .mentor-rating span {
          font-weight: 600;
          color: #374151;
        }

        .mentor-rating .star-filled {
          color: #fbbf24;
        }

        .mentor-rating .star-empty {
          color: #d1d5db;
        }

        .mentor-rating .rating-value {
          margin-left: 0.3rem;
          color: #6b7280;
        }

        /* Animations */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .main-content {
            padding: 1.5rem;
            padding-top: 100px; /* Maintain padding for navbar on mobile */
            margin-left: 0;
          }

          .phases-container {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .mobile-menu-btn {
            display: block;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .date-range {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;