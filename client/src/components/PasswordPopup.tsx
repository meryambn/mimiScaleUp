import React, { useState } from 'react';

interface PasswordPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordFormData {
  currentEmail: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ApiResponse {
  error?: string;
  message?: string;
}

const PasswordPopup: React.FC<PasswordPopupProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<PasswordFormData>({
    currentEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return false;
    }

    if (formData.newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8083/api/auth/updateMotdepasse', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: formData.currentEmail,
          oldPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Réponse non-JSON reçue:', text);
        throw new Error('Le serveur a renvoyé une réponse inattendue');
      }

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du mot de passe');
      }

      setSuccess('Mot de passe mis à jour avec succès');
      setTimeout(() => {
        onClose();
        // Réinitialiser les champs
        setFormData({
          currentEmail: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }, 2000);
    } catch (err) {
      console.error('Erreur complète:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`popup-overlay ${isOpen ? 'active' : ''}`}>
      <div className="popup-content">
        <button className="close-popup" onClick={onClose}>
          &times;
        </button>
        <h3>Changer le mot de passe</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentEmail">Email actuel</label>
            <input
              id="currentEmail"
              name="currentEmail"
              type="email"
              value={formData.currentEmail}
              onChange={handleInputChange}
              placeholder="Entrez votre email actuel"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="currentPassword">Mot de passe actuel</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleInputChange}
              placeholder="Entrez votre mot de passe actuel"
              required
            />
          </div>
           
          <div className="form-group">
            <label htmlFor="newPassword">Nouveau mot de passe</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="Entrez votre nouveau mot de passe"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirmez votre nouveau mot de passe"
              required
              className={error ? 'error-input' : ''}
            />
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
          </div>
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Chargement...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .success-message {
          color: #10b981;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
        }

        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .popup-overlay.active {
          opacity: 1;
          visibility: visible;
        }

        .popup-content {
          background: white;
          padding: 2.5rem;
          border-radius: 16px;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          position: relative;
          transform: translateY(60px);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .popup-overlay.active .popup-content {
          transform: translateY(0);
        }

        .close-popup {
          position: absolute;
          top: 20px;
          right: 20px;
          font-size: 1.8rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          transition: transform 0.2s ease;
        }

        .close-popup:hover {
          color: #374151;
          transform: rotate(90deg);
        }

        .popup-content h3 {
          margin-bottom: 2rem;
          color: #111827;
          font-size: 1.5rem;
          text-align: center;
          font-weight: 600;
        }

        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.8rem;
        }

        .form-group {
          flex: 1;
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.8rem;
          font-weight: 500;
          color: #374151;
          font-size: 0.95rem;
        }

        .form-group input {
          width: 100%;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background-color: #f9fafb;
        }

        .form-group input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          background-color: white;
        }

        .error-input {
          border-color: #ef4444 !important;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }

        .submit-btn {
          width: 100%;
          padding: 1.1rem;
          background: var(--gradient);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
          box-shadow: 0 4px 6px rgba(79, 70, 229, 0.1);
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(79, 70, 229, 0.15);
          opacity: 0.95;
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        @media (max-width: 480px) {
          .popup-content {
            padding: 2rem 1.5rem;
            width: 95%;
          }
          
          .popup-content h3 {
            font-size: 1.3rem;
          }
          
          .form-row {
            flex-direction: column;
            gap: 0;
          }
          
          .form-group {
            margin-bottom: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PasswordPopup; 