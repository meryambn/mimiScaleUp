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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/sidebar';
import ProgramPhaseTimeline from '@/components/widgets/ProgramPhaseTimeline';
import { useLivrables } from '@/hooks/useLivrables';
import PhasesWidget from '@/components/widgets/PhasesWidget';
import DeliverablesWidget from '@/components/widgets/DeliverablesWidget';

interface Deliverable {
  id: number;
  nom: string;
  description: string;
  date_echeance: string;
  types_fichiers: string[];
  phase_id: number;
  status?: 'submitted' | 'pending' | 'approved' | 'rejected';
  size?: string;
}

const StartupDeliverablesPage = () => {
  const [activePhase, setActivePhase] = useState(1);
  const [activeTab, setActiveTab] = useState('pending');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { livrables, loading: livrablesLoading, error: livrablesError, createLivrable, deleteLivrable } = useLivrables(activePhase);

  // Phase data for the filter widget
  const phases = [
    { id: 1, name: "Phase 1", color: "#4f46e5", status: "completed" },
    { id: 2, name: "Phase 2", color: "#0ea5e9", status: "in-progress" },
    { id: 3, name: "Phase 3", color: "#10b981", status: "upcoming" },
    { id: 4, name: "Phase 4", color: "#f59e0b", status: "not_started" }
  ];

  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/liverable/get/${activePhase}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des livrables');
        }
        const data = await response.json();
        setDeliverables(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliverables();
  }, [activePhase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile({
        name: file.name,
        type: file.type.split('/')[1],
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        file: file
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile.file);
        formData.append('nom', selectedFile.name);
        formData.append('description', "Document soumis");
        formData.append('date_echeance', new Date().toISOString().split('T')[0]);
        formData.append('types_fichiers', `.${selectedFile.type}`);
        formData.append('phase_id', activePhase.toString());
        formData.append('status', 'pending');

        const response = await fetch('/api/liverable/create', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la création du livrable');
        }

        // Rafraîchir la liste des livrables
        const updatedResponse = await fetch(`/api/liverable/get/${activePhase}`);
        const updatedData = await updatedResponse.json();
        setDeliverables(updatedData);

        setSelectedFile(null);
        setShowUploadModal(false);
      } catch (error) {
        console.error('Erreur lors de la création du livrable:', error);
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/liverable/delete/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du livrable');
      }

      // Rafraîchir la liste des livrables
      const updatedResponse = await fetch(`/api/liverable/get/${activePhase}`);
      const updatedData = await updatedResponse.json();
      setDeliverables(updatedData);
    } catch (error) {
      console.error('Erreur lors de la suppression du livrable:', error);
    }
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FaFilePdf className="h-4 w-4 text-red-500" />;
      case 'doc':
      case 'docx': return <FaFileWord className="h-4 w-4 text-blue-500" />;
      case 'xls':
      case 'xlsx': return <FaFileExcel className="h-4 w-4 text-green-500" />;
      case 'ppt':
      case 'pptx': return <FaFileImage className="h-4 w-4 text-orange-500" />;
      default: return <FaFileImage className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <FaSpinner className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non soumis";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        <p>Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className="deliverables-container">
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="deliverables-header">
          <div>
            <h1>Livrables - Phase {activePhase}</h1>
            <p className="subtitle">Documents à soumettre pour votre startup</p>
          </div>
          <motion.button
            className="primary-btn"
            onClick={() => setShowUploadModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPlus /> Nouveau livrable
          </motion.button>
        </header>

        {/* Widgets Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <PhasesWidget />
          <DeliverablesWidget />
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deliverables.map((deliverable) => (
              <div
                key={deliverable.id}
                className={cn(
                  "bg-white rounded-lg border p-4 space-y-3",
                  deliverable.status === 'approved' ? "border-green-200" :
                  deliverable.status === 'rejected' ? "border-red-200" :
                  "border-gray-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(deliverable.types_fichiers[0]?.replace('.', '') || '')}
                    <div>
                      <h4 className="text-sm font-medium">{deliverable.nom}</h4>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        Échéance {formatDate(deliverable.date_echeance)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(deliverable.status || 'pending')}
                    <Badge className={cn(
                      "ml-2",
                      deliverable.status === 'approved' ? "bg-green-100 text-green-800" :
                      deliverable.status === 'rejected' ? "bg-red-100 text-red-800" :
                      "bg-blue-100 text-blue-800"
                    )}>
                      {deliverable.status === 'approved' ? 'Validé' :
                       deliverable.status === 'rejected' ? 'Rejeté' :
                       'En attente'}
                    </Badge>
                  </div>
                </div>

                {deliverable.description && (
                  <p className="text-sm text-gray-500">{deliverable.description}</p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    {deliverable.types_fichiers.map((type, index) => (
                      <span key={index} className="text-xs text-gray-500">
                        {getFileIcon(type.replace('.', ''))}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    {deliverable.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(deliverable.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <FaFileUpload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUploadModal(false)}
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
                onClick={() => setShowUploadModal(false)}
              >
                &times;
              </button>

              <h2>Soumettre un nouveau livrable (Phase {activePhase})</h2>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nom du document</label>
                  <input
                    type="text"
                    required
                    value={selectedFile?.name || ''}
                    onChange={(e) => setSelectedFile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="file-upload-container">
                  <label className="file-upload-label">
                    <FaFileUpload className="upload-icon" />
                    <span>{selectedFile ? selectedFile.name : 'Choisir un fichier'}</span>
                    <input
                      type="file"
                      className="file-input"
                      onChange={handleFileChange}
                      required
                    />
                  </label>
                  {selectedFile && (
                    <div className="file-preview">
                      {getFileIcon(selectedFile.type)}
                      <div>
                        <p>{selectedFile.name}</p>
                        <p className="file-size">{selectedFile.size}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <motion.button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowUploadModal(false)}
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
          padding-top: 100px; /* Add padding to account for the navbar height */
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
          background: linear-gradient(135deg, #e43e32 0%, #0c4c80 100%);
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
          background: rgb(241, 241, 241);
          border-radius: 8px;
          padding: 1rem;
          border-left: 4px solid rgb(255, 8, 8);
        }

        .required-docs-card h2 {
          margin-top: 0;
          color: #111827;
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }

        .required-docs-card ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .required-docs-card li {
          margin-bottom: 0.5rem;
          color: #374151;
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

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .file-upload-container {
          margin-bottom: 1.5rem;
        }

        .file-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
        }

        .file-upload-label:hover {
          border-color: #e43e32;
          background: rgba(228, 62, 50, 0.05);
        }

        .upload-icon {
          font-size: 2rem;
          color: #e43e32;
          margin-bottom: 0.5rem;
        }

        .file-input {
          display: none;
        }

        .file-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
          padding: 1rem;
          background: #f3f4f6;
          border-radius: 6px;
        }

        .file-preview .file-icon {
          font-size: 1.5rem;
        }

        .file-preview p {
          margin: 0;
        }

        .file-size {
          color: #6b7280;
          font-size: 0.85rem;
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
            padding-top: 100px; /* Maintain padding for navbar on mobile */
          }

          .deliverables-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
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

export default StartupDeliverablesPage;