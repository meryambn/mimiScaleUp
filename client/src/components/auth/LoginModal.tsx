import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface LoginModalProps {
  show: boolean;
  onClose: () => void;
  switchToRegister: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  utilisateur: {
    id: number;
    email: string;
    role: 'startup' | 'mentor' | 'particulier' | 'admin';
    infosRole: Record<string, any>;
  };
  token: string;
  error?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ show, onClose, switchToRegister }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const validateForm = (): boolean => {
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

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Appel direct à l'API de login
      const response = await fetch('http://localhost:8083/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          motDePasse: formData.password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Identifiants invalides');
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.utilisateur));
      localStorage.setItem('role', data.utilisateur.role);
      localStorage.setItem('token', data.token);

      // Call the login function from AuthContext
      await login(formData.email, formData.password);

      // Show success toast
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur ScaleUp!",
      });

      // Close modal and redirect based on user role
      onClose();
      
      // Attendre un court instant pour s'assurer que le modal est fermé
      setTimeout(() => {
        if (data.utilisateur.role === 'particulier') {
          setLocation('/particulier/profile');
        } else if (data.utilisateur.role === 'startup') {
          setLocation('/startup/profile');
        } else {
          setLocation('/dashboard');
        }
      }, 100);
    } catch (error) {
      console.error('Erreur serveur:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de la connexion';
      setError(errorMessage);
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Connexion</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="error-message">{error}</p>}
          {loading && <p className="loading-message">Chargement...</p>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="cta-button" disabled={loading}>
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="demo-accounts">
          <h4>Comptes de démonstration:</h4>
          <p><strong>Admin:</strong> admin@example.com / password</p>
          <p><strong>Mentor:</strong> mentor@example.com / password</p>
        </div>

        <div className="auth-redirect">
          <p>Pas de compte ?
            <button
              className="link-button"
              onClick={switchToRegister}
              disabled={loading}
            >
              S'inscrire
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
