import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: number;
  texte_question: string;
  type: string;
  options?: string[];
  obligatoire: boolean;
  description?: string;
  evaluation_min?: number;
  evaluation_max?: number;
}

interface Formulaire {
  id: number;
  titre: string;
  description: string;
  questions: Question[];
}

interface SoumissionResponse {
  message: string;
  soumission_id: number;
}

interface User {
  id: number;
  email: string;
  role: string;
}

const FormulairePage: React.FC = () => {
  const [, setLocation] = useLocation();
  const params = useParams();
  const [formData, setFormData] = useState<Formulaire | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier d'abord le localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('Erreur lors du parsing des données utilisateur:', err);
        localStorage.removeItem('user');
      }
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:8083/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          setError('Veuillez vous connecter pour accéder au formulaire');
          localStorage.removeItem('user');
          setLocation('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.utilisateur) {
          throw new Error('Format de réponse invalide');
        }

        const userData = {
          id: data.utilisateur.id,
          email: data.utilisateur.email,
          role: data.utilisateur.role
        };

        // Mettre à jour le localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } catch (err) {
        console.error('Erreur détaillée:', err);
        if (err instanceof Error) {
          setError(`Erreur lors de la récupération des données utilisateur: ${err.message}`);
        } else {
          setError('Une erreur inattendue est survenue');
        }
        // En cas d'erreur, supprimer les données du localStorage
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchForm = async () => {
      const programId = params?.id;
      if (!programId) {
        setError('ID du programme non spécifié');
        return;
      }

      try {
        const response = await fetch(`http://localhost:8083/api/form/programmes/${programId}/form`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        setFormData(data.formulaire);
      } catch (err) {
        console.error('Erreur détaillée:', err);
        if (err instanceof Error) {
          setError(`Erreur lors du chargement du formulaire: ${err.message}`);
        } else {
          setError('Une erreur inattendue est survenue');
        }
      }
    };

    // Si pas d'utilisateur dans le localStorage, faire la requête
    if (!storedUser) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
    
    fetchForm();
  }, [setLocation, params?.id]);

  const handleInputChange = (questionId: number, value: string | string[]) => {
    setFormValues(prev => ({
      ...prev,
      [questionId]: value
    }));
    if (typeof value === 'string' && value.trim() || Array.isArray(value) && value.length > 0) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (questionId: number, option: string) => {
    const currentValues = (formValues[questionId] as string[]) || [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter(v => v !== option)
      : [...currentValues, option];
    
    handleInputChange(questionId, newValues);
  };

  const validateForm = (): boolean => {
    if (!formData) return false;

    const errors: Record<number, string> = {};
    let isValid = true;

    formData.questions.forEach(question => {
      const value = formValues[question.id];
      if (question.obligatoire) {
        if (!value || 
            (typeof value === 'string' && !value.trim()) || 
            (Array.isArray(value) && value.length === 0)) {
          errors[question.id] = 'Ce champ est obligatoire';
          isValid = false;
        }
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      setError('Vous devez être connecté pour soumettre le formulaire');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Préparer les réponses pour l'envoi
      const reponses = formData?.questions.map(question => ({
        question_id: question.id,
        valeur: Array.isArray(formValues[question.id]) 
          ? (formValues[question.id] as string[]).join(',') 
          : formValues[question.id] || ''
      })) || [];

      // Envoyer la soumission au backend
      const response = await fetch('http://localhost:8083/api/soum/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          formulaire_id: formData?.id,
          utilisateur_id: user.id,
          role: user.role,
          reponses: reponses
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Erreur HTTP: ${response.status}`);
      }

      const data: SoumissionResponse = await response.json();
      setSubmitted(true);
      setLocation(`/startup/notifications/${params?.id}`);
    } catch (err) {
      console.error('Erreur détaillée:', err);
      if (err instanceof Error) {
        setError(`Erreur lors de la soumission du formulaire: ${err.message}`);
      } else {
        setError('Une erreur inattendue est survenue lors de la soumission');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionInput = (question: Question) => {
    const value = formValues[question.id] || '';
    const error = validationErrors[question.id];

    switch (question.type) {
      case 'Single-Line':
        return (
          <input
            type="text"
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white mb-2`}
            placeholder="Votre réponse..."
            value={value as string}
            onChange={e => handleInputChange(question.id, e.target.value)}
            required={question.obligatoire}
          />
        );

      case 'Multi-Line':
        return (
          <textarea
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white mb-2`}
            rows={4}
            placeholder="Votre réponse..."
            value={value as string}
            onChange={e => handleInputChange(question.id, e.target.value)}
            required={question.obligatoire}
          />
        );

      case 'RadioButtons':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={value === option}
                  onChange={e => handleInputChange(question.id, e.target.value)}
                  required={question.obligatoire}
                  className="text-blue-500 focus:ring-blue-400"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'Checkboxes':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={option}
                  checked={(value as string[] || []).includes(option)}
                  onChange={() => handleCheckboxChange(question.id, option)}
                  required={question.obligatoire}
                  className="text-blue-500 focus:ring-blue-400"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      case 'liste_deroulante':
        return (
          <select
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white mb-2`}
            value={value as string}
            onChange={e => handleInputChange(question.id, e.target.value)}
            required={question.obligatoire}
          >
            <option value="">Sélectionnez une option</option>
            {question.options?.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'evaluation':
        return (
          <div className="flex items-center space-x-4">
            {Array.from({ length: (question.evaluation_max || 5) - (question.evaluation_min || 1) + 1 }, (_, i) => i + (question.evaluation_min || 1)).map((rating) => (
              <label key={rating} className="flex flex-col items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={rating.toString()}
                  checked={value === rating.toString()}
                  onChange={e => handleInputChange(question.id, e.target.value)}
                  required={question.obligatoire}
                  className="text-blue-500 focus:ring-blue-400"
                />
                <span className="text-sm mt-1">{rating}</span>
              </label>
            ))}
          </div>
        );

      case 'telechargement_fichier':
        return (
          <div className="w-full">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, PNG, JPG (MAX. 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleInputChange(question.id, file.name);
                    }
                  }}
                  required={question.obligatoire}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
              </label>
            </div>
            {value && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  Fichier sélectionné : {value}
                </p>
              </div>
            )}
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white mb-2`}
            placeholder="Votre réponse..."
            value={value as string}
            onChange={e => handleInputChange(question.id, e.target.value)}
            required={question.obligatoire}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-center mb-4">Erreur</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-yellow-500 text-center mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-center mb-4">Authentification requise</h2>
          <p className="text-gray-600 text-center mb-6">Veuillez vous connecter pour accéder au formulaire</p>
          <button
            onClick={() => setLocation('/login')}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6 pt-2">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-2 leading-tight">{formData.titre}</h1>
        <p className="text-lg text-gray-500 mb-10">{formData.description}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {formData.questions.map((question) => (
            <div key={question.id} className="flex flex-col items-start mb-2">
              <label className="block text-base font-semibold text-gray-800 mb-2">
                {question.texte_question}
                {question.obligatoire && <span className="text-red-500 ml-1">*</span>}
              </label>
              {question.description && (
                <p className="mb-2 text-sm text-gray-500">{question.description}</p>
              )}
              {renderQuestionInput(question)}
              {validationErrors[question.id] && (
                <p className="text-red-500 text-sm mt-1">{validationErrors[question.id]}</p>
              )}
            </div>
          ))}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 text-base font-bold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition-all duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Envoi en cours...' : 'Soumettre'}
            </button>
          </div>
        </form>
        {submitted && (
          <div className="mt-8 text-green-600 font-semibold text-lg">Réponse envoyée !</div>
        )}
      </div>
    </div>
  );
};

export default FormulairePage; 