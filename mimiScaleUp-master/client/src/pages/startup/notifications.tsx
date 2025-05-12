import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import Modal from '../../components/Modal';
import { Card, CardContent } from '@mui/material';
import { Badge } from '@mui/material';

interface Programme {
  id: string;
  nom: string;
  description: string;
  date_debut: string;
  date_fin: string;
  statut: string;
}

interface FormQuestion {
  id: string;
  texte_question: string;
  type: string;
  options?: string[];
  required: boolean;
}

interface Form {
  id: string;
  titre: string;
  description: string;
  message_confirmation: string;
  url_formulaire: string;
  programme_id: string;
  questions: FormQuestion[];
}

const NotificationsPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const params = useParams();
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [isLoadingProgramme, setIsLoadingProgramme] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentForm, setCurrentForm] = useState<Form | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger le formulaire immédiatement
  useEffect(() => {
    const fetchForm = async () => {
      const programId = params?.id;
      if (!programId) {
        setError('ID du programme non spécifié');
        return;
      }

      try {
        setIsLoadingForm(true);
        const response = await fetch(`http://localhost:8083/api/form/programmes/${programId}/form`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch form');
        }

        const data = await response.json();
        setCurrentForm(data.formulaire);
      } catch (error) {
        console.error('Error fetching form:', error);
      } finally {
        setIsLoadingForm(false);
      }
    };

    fetchForm();
  }, [params?.id]);

  // Charger un programme spécifique
  useEffect(() => {
    const fetchProgramme = async () => {
      const programId = params?.id;
      if (!programId) {
        setError('ID du programme non spécifié');
        return;
      }

      try {
        setIsLoadingProgramme(true);
        setError(null);
        const response = await fetch(`http://localhost:8083/api/programmes/${programId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Programme non trouvé');
            return;
          }
          throw new Error('Failed to fetch programme');
        }
        const data = await response.json();
        setProgramme(data);
      } catch (error) {
        console.error('Error fetching programme:', error);
        setError('Erreur lors du chargement du programme');
      } finally {
        setIsLoadingProgramme(false);
      }
    };

    fetchProgramme();
  }, [params?.id]);

  // Fonction pour charger le formulaire
  const loadForm = async (programmeId: string) => {
    try {
      setIsLoadingForm(true);
      const response = await fetch(`http://localhost:8083/api/form/programmes/${programmeId}/form`);
      if (!response.ok) {
        throw new Error('Failed to fetch form');
      }
      const data = await response.json();
      setCurrentForm(data.formulaire);
      setIsFormModalOpen(true);
    } catch (error) {
      console.error('Error loading form:', error);
    } finally {
      setIsLoadingForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header élégant avec effet de verre */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setLocation('/startup/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-all duration-300 group"
            >
              <FaArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Dashboard</span>
            </button>

            <div className="flex items-center space-x-6">
              <button
                onClick={() => setLocation('/startup/profile')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-all duration-300"
              >
                <FaUser className="h-5 w-5" />
                <span className="font-medium">Profil</span>
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-700">
              Notifications
            </h1>
            <p className="text-gray-600 mt-2">
              Consultez vos notifications et restez informé des dernières mises à jour de vos programmes.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Programme */}
        <div className="mb-8">
          {isLoadingProgramme ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 bg-white rounded-xl shadow-sm">
              <p className="text-blue-500">{error}</p>
            </div>
          ) : programme ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{programme.nom}</h3>
                    <p className="text-gray-600 text-sm mb-4">{programme.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-4">Du {new Date(programme.date_debut).toLocaleDateString()}</span>
                      <span>Au {new Date(programme.date_fin).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-6">
                    <button
                      onClick={() => loadForm(programme.id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      Voir le formulaire
                    </button>
                  </div>
                </div>

                {/* Lien du formulaire en bas des informations */}
                {isLoadingForm ? (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                    </div>
                  </div>
                ) : currentForm?.url_formulaire && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-col items-center">
                      <p className="text-gray-600 mb-4">{currentForm.message_confirmation}</p>
                      <p className="text-gray-700">
                        <button
                          onClick={() => setLocation(`/startup/apply/${params?.id}`)}
                          className="text-blue-600 hover:text-red-700 underline transition-colors duration-300 cursor-pointer"
                        >
                          {`${window.location.origin}/startup/apply/${params?.id}`}
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">Aucun programme disponible</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal du formulaire */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={currentForm?.titre || 'Formulaire de candidature'}
      >
        {isLoadingForm ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : currentForm ? (
          <div className="flex flex-col flex-grow justify-center items-center min-h-[350px] w-full">
            <div className="prose max-w-none text-center mb-6">
              <p className="text-gray-600">{currentForm.description}</p>
            </div>
            <div className="flex flex-col items-center w-full space-y-8 flex-grow justify-center">
              {currentForm.questions.map((question, index) => (
                <div key={question.id} className="bg-gray-50 p-6 rounded-lg w-full max-w-xl flex flex-col items-center shadow-sm">
                  <label className="block text-base font-medium text-gray-700 mb-2 text-center">
                    {question.texte_question}
                    {question.required && <span className="text-blue-500 ml-1">*</span>}
                  </label>
                  <span className="mb-4 text-xs text-gray-500 italic">Type : {question.type}</span>
                  {/* Champ de réponse juste en dessous de la question */}
                  {question.type === 'text' && (
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      placeholder="Votre réponse..."
                    />
                  )}
                  {question.type === 'textarea' && (
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      rows={4}
                      placeholder="Votre réponse..."
                    />
                  )}
                  {question.type === 'select' && question.options && (
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2">
                      <option value="">Sélectionnez une option</option>
                      {question.options.map((option, i) => (
                        <option key={i} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Formulaire non disponible</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NotificationsPage;