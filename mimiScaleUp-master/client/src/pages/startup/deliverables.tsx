import React, { useState, useEffect } from 'react';
import {
  FaFileUpload,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaTrash,
  FaCheckCircle,
  FaSpinner,
  FaTimesCircle,
  FaPlus
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/sidebar';
import ProgramPhaseTimeline from '@/components/widgets/ProgramPhaseTimeline';
import { useProgramContext } from '@/context/ProgramContext';
import { useDeliverables } from '@/context/DeliverablesContext';
import { useAuth } from '@/context/AuthContext';
import { getPhaseDeliverables } from '@/services/deliverableService';

interface ProgramPhase {
  id: number;
  name: string;
  description: string;
}

const Deliverables: React.FC = () => {
  const { user } = useAuth();
  const { selectedProgram, selectedPhaseId, setSelectedPhaseId } = useProgramContext();
  const { deliverables, filteredDeliverables, getStatusText, getSubmissionTypeIcon } = useDeliverables();

  const [activePhase, setActivePhase] = useState<number>(Number(selectedPhaseId) || 1);
  const [activeTab, setActiveTab] = useState('pending');
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    date_echeance: '',
    types_fichiers: ''
  });

  // Fetch deliverables when phase changes
  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        const data = await getPhaseDeliverables(String(activePhase));
        console.log('Fetched deliverables:', data);
      } catch (error) {
        console.error('Error fetching deliverables:', error);
      }
    };

    fetchDeliverables();
  }, [activePhase]);

  useEffect(() => {
    if (selectedPhaseId) {
      setActivePhase(Number(selectedPhaseId));
    }
  }, [selectedPhaseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.nom || !formData.description || !formData.date_echeance) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!selectedFile) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    // Get file extension
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!fileExtension) {
      alert('Extension de fichier invalide');
      return;
    }

    try {
      // First, create the deliverable
      const deliverableData = {
        nom: formData.nom,
        description: formData.description,
        date_echeance: formData.date_echeance,
        types_fichiers: `.${fileExtension}`
      };

      console.log('Sending deliverable data:', deliverableData);

      const response = await fetch(`/api/liverable/create/${activePhase}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(deliverableData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du livrable');
      }

      const data = await response.json();
      console.log('Livrable créé avec succès:', data);

      // Now upload the file if deliverable was created successfully
      if (data.id) {
        const fileFormData = new FormData();
        fileFormData.append('fichier', selectedFile);
        fileFormData.append('livrable_id', data.id);

        const fileResponse = await fetch(`/api/liverable/upload/${data.id}`, {
          method: 'POST',
          body: fileFormData,
          credentials: 'include'
        });

        if (!fileResponse.ok) {
          throw new Error('Erreur lors du téléchargement du fichier');
        }
      }

      // Fetch updated deliverables
      const updatedDeliverables = await getPhaseDeliverables(String(activePhase));
      console.log('Updated deliverables:', updatedDeliverables);

      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        description: '',
        date_echeance: '',
        types_fichiers: ''
      });
      setSelectedFile(null);
      setShowForm(false);
    } catch (error) {
      console.error('Erreur lors de la création du livrable:', error);
      alert(error instanceof Error ? error.message : 'Une erreur est survenue lors de la création du livrable');
    }
  };

  const handlePhaseChange = (phase: number) => {
    setActivePhase(phase);
    setSelectedPhaseId(phase);
    setActiveTab('pending');
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FaFilePdf className="file-icon pdf" />;
      case 'doc':
      case 'docx': return <FaFileWord className="file-icon word" />;
      case 'xls':
      case 'xlsx': return <FaFileExcel className="file-icon excel" />;
      case 'ppt':
      case 'pptx': return <FaFileImage className="file-icon ppt" />;
      default: return <FaFileImage className="file-icon generic" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <FaCheckCircle className="status-icon approved" />;
      case 'pending': return <FaSpinner className="status-icon pending" />;
      case 'rejected': return <FaTimesCircle className="status-icon rejected" />;
      case 'not-submitted': return <FaTimesCircle className="status-icon not-submitted" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non soumis";
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Get phase description
  const getPhaseDescription = (phaseId: number) => {
    if (selectedProgram && selectedProgram.phases) {
      const phase = selectedProgram.phases.find(p => Number(p.id) === phaseId);
      if (phase) {
        return phase.description;
      }
    }
    return "Description non disponible";
  };

  // Filter deliverables by active phase and tab
  const phaseDeliverables = filteredDeliverables.filter(d => 
    Number(d.phaseId) === activePhase
  );

  const requiredDeliverables = phaseDeliverables.filter(d => d.required);
  const optionalDeliverables = phaseDeliverables.filter(d => !d.required);

  return (
    <div className="deliverables-container">
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="deliverables-header">
          <div>
            <h1>Livrables - {selectedProgram?.name || 'Programme'}</h1>
            <p className="subtitle">Documents à soumettre pour votre startup</p>
          </div>
          <motion.button
            className="primary-btn"
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPlus /> Nouveau livrable
          </motion.button>
        </header>

        {/* Phases Navigation */}
        <section className="phases-section">
          <ProgramPhaseTimeline
            phases={(selectedProgram?.phases || []).map(phase => ({
              id: Number(phase.id),
              name: phase.name,
              description: phase.description
            }))}
            selectedPhase={activePhase}
            onPhaseChange={handlePhaseChange}
            title="Chronologie des phases"
            description={getPhaseDescription(activePhase)}
          />
        </section>

        {/* Status Tabs Section */}
        <section className="tabs-section">
          <div className="tabs">
            <motion.button
              className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              En attente
            </motion.button>
            <motion.button
              className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveTab('approved')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Validés
            </motion.button>
            <motion.button
              className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
              onClick={() => setActiveTab('rejected')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Rejetés
            </motion.button>
          </div>
        </section>

        {/* Deliverables List */}
        <section className="deliverables-list">
          <AnimatePresence>
            {phaseDeliverables.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FaFileUpload className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun livrable</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Aucun livrable disponible pour la phase {activePhase}.
                </p>
              </div>
            ) : (
              phaseDeliverables
                .filter(d => activeTab === 'all' || d.status === activeTab)
                .map(deliverable => (
                  <motion.div
                    key={deliverable.id}
                    className={`deliverable-card ${deliverable.required ? 'required' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="card-header">
                      <div className="file-info">
                        {getSubmissionTypeIcon(deliverable.submissionType)}
                        <div>
                          <h3 className="file-name">{deliverable.name}</h3>
                          <p className="file-meta">
                            {formatDate(deliverable.dueDate)} • {deliverable.required ? 'Requis' : 'Optionnel'}
                          </p>
                        </div>
                      </div>
                      <div className="file-status">
                        <span className={`status-text ${deliverable.status}`}>
                          {getStatusText(deliverable.status, deliverable.dueDate)}
                        </span>
                      </div>
                    </div>

                    <div className="card-actions">
                      {deliverable.status === 'pending' && (
                        <button className="action-btn delete">
                          <FaTrash /> Supprimer
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
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
                onClick={() => setShowForm(false)}
              >
                &times;
              </button>

              <h2>Ajouter un livrable</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Date d'échéance</label>
                  <input
                    type="date"
                    required
                    value={formData.date_echeance}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_echeance: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Types de fichiers</label>
                  <input
                    type="text"
                    required
                    value={formData.types_fichiers}
                    onChange={(e) => setFormData(prev => ({ ...prev, types_fichiers: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Fichier</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="form-actions">
                  <motion.button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowForm(false)}
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
                    Soumettre
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS Styles */}
      <style jsx>{`
        .deliverables-container {
          display: flex;
          min-height: 100vh;
          background-color: #f9fafb;
          position: relative;
        }

        .main-content {
          flex: 1;
          padding: 2rem;
          padding-top: 100px;
          margin-left: 280px;
          min-height: 100vh;
        }

        .deliverables-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .deliverables-header h1 {
          font-size: 1.5rem;
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
          font-weight: 300;
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

        /* Phases Navigation */
        .phases-section {
          margin-bottom: 1.5rem;
        }

        /* Required Documents Section */
        .required-docs-section {
          margin-bottom: 2rem;
        }

        .required-docs-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border-left: 4px solid #e43e32;
        }

        .required-docs-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          margin-bottom: 1rem;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .file-icon {
          font-size: 2rem;
          color: #e43e32;
        }

        .file-name {
          font-size: 1.1rem;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }

        .file-meta {
          color: #6b7280;
          font-size: 0.85rem;
          margin: 0;
        }

        .card-content {
          padding-top: 1rem;
        }

        .documents-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .document-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 4px;
          background: #f9fafb;
          margin-bottom: 0.5rem;
        }

        .document-icon {
          color: #e43e32;
          font-size: 1.25rem;
        }

        .empty-state {
          text-align: center;
          padding: 2rem 0;
        }

        /* Tabs Section */
        .tabs-section {
          margin-bottom: 2rem;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
        }

        .tab.active {
          color: #e43e32;
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #e43e32;
        }

        /* Deliverables List */
        .deliverables-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .deliverable-card {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border-left: 4px solid #e43e32;
        }

        .deliverable-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .deliverable-card.required {
          border-left: 4px solid rgb(255, 3, 3);
          background-color: rgba(255, 0, 0, 0.05);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .file-icon {
          font-size: 2rem;
        }

        .file-icon.pdf {
          color: #e43e32;
        }

        .file-icon.word {
          color: #2b579a;
        }

        .file-icon.excel {
          color: #217346;
        }

        .file-icon.ppt {
          color: #d24726;
        }

        .file-icon.generic {
          color: #6b7280;
        }

        .file-name {
          font-size: 1.1rem;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }

        .file-meta {
          color: #6b7280;
          font-size: 0.85rem;
          margin: 0;
        }

        .file-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-icon {
          font-size: 1.2rem;
        }

        .status-icon.approved {
          color: #10b981;
        }

        .status-icon.pending {
          color: #f59e0b;
          animation: spin 2s linear infinite;
        }

        .status-icon.rejected {
          color: #ef4444;
        }

        .status-icon.not-submitted {
          color: #6b7280;
        }

        .status-text {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .status-text.approved {
          color: #10b981;
        }

        .status-text.pending {
          color: #f59e0b;
        }

        .status-text.rejected {
          color: #ef4444;
        }

        .status-text.not-submitted {
          color: #6b7280;
        }

        .card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-btn.download {
          background: #e0e7ff;
          color: #4f46e5;
          border: none;
        }

        .action-btn.delete {
          background: #fee2e2;
          color: #ef4444;
          border: none;
        }

        .action-btn.resubmit {
          background: #fef3c7;
          color: #d97706;
          border: none;
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
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }

        .secondary-btn {
          background: none;
          color: #e43e32;
          border: 1px solid #e43e32;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .secondary-btn:hover {
          background: rgba(228, 62, 50, 0.1);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 1rem;
            padding-top: 100px;
          }

          .deliverables-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .primary-btn {
            width: 100%;
          }

          .card-actions {
            flex-direction: column;
          }

          .form-actions {
            flex-direction: column;
          }

          .primary-btn, .secondary-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Deliverables;