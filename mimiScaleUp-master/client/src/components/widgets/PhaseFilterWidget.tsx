import React from 'react';
import { motion } from 'framer-motion';

interface Phase {
  id: number;
  name: string;
  color: string;
  status?: 'completed' | 'in-progress' | 'upcoming' | 'not_started';
}

interface PhaseFilterWidgetProps {
  phases: Phase[];
  selectedPhase: number | null;
  onPhaseChange: (phaseId: number | null) => void;
}

const PhaseFilterWidget: React.FC<PhaseFilterWidgetProps> = ({
  phases,
  selectedPhase,
  onPhaseChange
}) => {
  // Calculate width for each phase segment
  const width = `${100 / phases.length}%`;

  return (
    <div className="phase-filter-widget">
      <div className="phase-filter-container">
        <div className="phase-segments">
          {phases.map((phase, i) => (
            <motion.div
              key={phase.id}
              className={`phase-segment ${selectedPhase === phase.id ? 'selected' : ''}`}
              style={{
                width,
                backgroundColor: phase.color,
                opacity: phase.status === 'not_started' ? 0.7 : 1,
                zIndex: phases.length - i // Ensure later phases appear on top
              }}
              onClick={() => onPhaseChange(selectedPhase === phase.id ? null : phase.id)}
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="phase-name">{phase.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedPhase && (
        <div className="selected-phase-indicator">
          <div
            className="phase-indicator-dot"
            style={{
              backgroundColor: phases.find(p => p.id === selectedPhase)?.color || '#4f46e5'
            }}
          ></div>
          <span className="phase-indicator-text">
            Filtré par phase : {phases.find(p => p.id === selectedPhase)?.name}
          </span>
          <motion.button
            className="clear-filter-btn"
            onClick={() => onPhaseChange(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Effacer
          </motion.button>
        </div>
      )}

      <style jsx>{`
        .phase-filter-widget {
          margin-bottom: 1.5rem;
        }

        .phase-filter-container {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 1rem;
        }

        .phase-segments {
          display: flex;
          height: 40px;
          border-radius: 6px;
          overflow: hidden;
        }

        .phase-segment {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          color: white;
          font-weight: 500;
          font-size: 0.9rem;
          text-align: center;
          padding: 0 0.5rem;
        }

        .phase-segment.selected {
          box-shadow: inset 0 0 0 2px white;
          z-index: 10;
        }

        .phase-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .selected-phase-indicator {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          background-color: #f0f9ff;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .phase-indicator-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 0.5rem;
        }

        .phase-indicator-text {
          flex: 1;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .clear-filter-btn {
          background: none;
          border: none;
          color: #4f46e5;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .clear-filter-btn:hover {
          background-color: #f5f5f5;
        }

        @media (max-width: 640px) {
          .phase-segment {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PhaseFilterWidget;
