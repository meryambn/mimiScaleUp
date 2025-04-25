import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RegisterModalProps {
  show: boolean;
  onClose: () => void;
  switchToLogin: () => void;
}

type UserType = 'startup' | 'mentor' | 'particulier' | null;

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  startupName?: string;
  companyFile?: File | null;
  website?: string;
  creationYear?: string;
  employees?: string;
  profession?: string;
  firstName?: string;
  lastName?: string;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ show, onClose, switchToLogin }) => {
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide.');
      return false;
    }

    // Password validation
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return false;
    }

    // Phone validation (basic)
    if (formData.phone.length < 10) {
      setError('Veuillez entrer un numéro de téléphone valide.');
      return false;
    }

    // Additional validations based on user type
    if (selectedUserType === 'startup') {
      if (!formData.startupName?.trim()) {
        setError('Le nom de la startup est requis.');
        return false;
      }
      if (!formData.creationYear) {
        setError("L'année de création est requise.");
        return false;
      }
    }

    if (selectedUserType === 'mentor' || selectedUserType === 'particulier') {
      if (!formData.lastName?.trim()) {
        setError('Le nom est requis.');
        return false;
      }
      if (!formData.firstName?.trim()) {
        setError('Le prénom est requis.');
        return false;
      }
      if (selectedUserType === 'mentor' && !formData.profession?.trim()) {
        setError('La profession est requise pour les mentors.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();

    // Common fields
    formDataToSend.append('email', formData.email.trim());
    formDataToSend.append('password', formData.password);
    formDataToSend.append('telephone', formData.phone.trim());
    formDataToSend.append('role', selectedUserType?.toLowerCase() || '');

    // Role-specific fields
    if (selectedUserType === 'startup') {
      formDataToSend.append('infosRole[startupName]', formData.startupName || '');
      formDataToSend.append('infosRole[website]', formData.website || '');
      formDataToSend.append('infosRole[creationYear]', formData.creationYear || '');
      formDataToSend.append('infosRole[employees]', formData.employees || '');
    } else if (selectedUserType === 'mentor' || selectedUserType === 'particulier') {
      formDataToSend.append('infosRole[lastName]', formData.lastName?.trim() || '');
      formDataToSend.append('infosRole[firstName]', formData.firstName?.trim() || '');
      
      if (selectedUserType === 'mentor') {
        formDataToSend.append('infosRole[profession]', formData.profession?.trim() || '');
      }
    }

    try {
      const response = await fetch('http://localhost:8083/api/auth/register', {
        method: 'POST',
        body: formDataToSend
      });

      const responseData = await response.json();

      if (!response.ok) {
        const serverError = responseData.error || 
                          responseData.message || 
                          `Erreur serveur (code ${response.status})`;
        throw new Error(serverError);
      }

      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès",
      });

      // Reset form and close modal
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
      });
      setSelectedUserType(null);
      onClose();
      switchToLogin();
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      
      if (err.message.includes('email')) {
        setError('Cet email est déjà utilisé. Veuillez en choisir un autre.');
      } else if (err.message.includes('validation')) {
        setError('Données invalides. Vérifiez les informations saisies.');
      } else {
        setError(err.message || 'Une erreur est survenue lors de l\'inscription.');
      }

      toast({
        title: "Erreur d'inscription",
        description: err.message || 'Une erreur est survenue lors de l\'inscription.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, companyFile: e.target.files[0] });
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            {selectedUserType
              ? `Créer un compte - ${selectedUserType === 'startup' ? 'Startup' :
                 selectedUserType === 'mentor' ? 'Mentor' : 'Particulier'}`
              : "Créer un compte"}
          </h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>

        {!selectedUserType ? (
          <div className="account-type-selection">
            <h4>Je suis :</h4>
            <button
              className="type-button"
              onClick={() => setSelectedUserType('startup')}
            >
              Une Startup
            </button>
            <button
              className="type-button"
              onClick={() => setSelectedUserType('mentor')}
            >
              Un Mentor
            </button>
            <button
              className="type-button"
              onClick={() => setSelectedUserType('particulier')}
            >
              Un Particulier
            </button>
          </div>
        ) : (
          <>
            <button
              className="back-button"
              onClick={() => setSelectedUserType(null)}
            >
              &lt; Retour
            </button>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && <p className="error-message">{error}</p>}
              {loading && <p className="loading-message">Chargement...</p>}

              {/* Common fields */}
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Téléphone mobile</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* Startup-specific fields */}
              {selectedUserType === 'startup' && (
                <>
                  <div className="form-group">
                    <label>Nom de la startup</label>
                    <input
                      type="text"
                      placeholder="ScaleUp"
                      required
                      value={formData.startupName}
                      onChange={(e) => setFormData({ ...formData, startupName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Site web</label>
                    <input
                      type="url"
                      placeholder="https://www.example.com/"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Année de création</label>
                    <input
                      type="number"
                      placeholder="2010"
                      min="1900"
                      max={new Date().getFullYear()}
                      required
                      value={formData.creationYear}
                      onChange={(e) => setFormData({ ...formData, creationYear: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Nombre d'employés</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.employees}
                      onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Mentor/Particulier fields */}
              {(selectedUserType === 'mentor' || selectedUserType === 'particulier') && (
                <>
                  <div className="form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Prénom</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>

                  {selectedUserType === 'mentor' && (
                    <div className="form-group">
                      <label>Profession</label>
                      <input
                        type="text"
                        required
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                      />
                    </div>
                  )}
                </>
              )}

              <button type="submit" className="cta-button" disabled={loading}>
                {loading ? 'Inscription en cours...' : 'S\'inscrire'}
              </button>
            </form>

            <div className="auth-redirect">
              <p>Déjà un compte ?
                <button className="link-button" onClick={switchToLogin}>
                  Se connecter
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterModal;
