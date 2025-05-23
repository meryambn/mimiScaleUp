import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
  const { setUser } = useAuth();
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
      console.log('Login attempt for:', formData.email);

      // Fetch approach for all users including admin
      const response = await fetch('http://localhost:8083/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          motDePasse: formData.password,
        }),
      });

      // For debugging
      console.log('Response status:', response.status);

      // Parse the JSON response
      const data = await response.json();
      console.log('Login response:', data);

      // Check if response is ok after parsing JSON
      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }

      // Check if this is an admin login response
      const isAdminLogin = data.message === 'connexion admin reussie';

      if (isAdminLogin) {
        console.log('Admin login detected from response');

        // Use the actual admin ID from the response
        let adminUser = {
          id: data.adminId || 1, // Use actual admin ID from response, fallback to 1
          name: data.email,
          email: data.email,
          role: 'admin' as const,
          profileImage: '',
          token: 'admin-token' // Placeholder token for admin
        };

        // Log the admin user we're using
        console.log('Using admin user with ID:', adminUser.id);

        console.log('Setting admin user in context and localStorage:', adminUser);

        // Store admin data in localStorage
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('role', 'admin');
        localStorage.setItem('token', 'admin-token');

        // Update the auth context with admin data
        setUser(adminUser);

        // Show success toast for admin
        toast({
          title: "Connexion admin réussie",
          description: "Bienvenue sur le panneau d'administration!",
        });

        // Close modal and redirect to admin dashboard
        onClose();

        // Redirect to admin dashboard
        setTimeout(() => {
          console.log('Redirecting to admin dashboard');
          // Use direct window.location.href assignment
          window.location.href = '/admin/dashboard';
        }, 1000);
      }
      else {
        // Handle regular user login
        if (!data.utilisateur) {
          throw new Error('Format de réponse invalide');
        }

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.utilisateur));
        localStorage.setItem('role', data.utilisateur.role);
        localStorage.setItem('token', data.token || '');

        // Update the auth context with user data
        setUser({
          id: data.utilisateur.id,
          name: data.utilisateur.email, // Use email as name if not provided
          email: data.utilisateur.email,
          role: data.utilisateur.role,
          profileImage: '', // Default empty string for profileImage
          token: data.token || ''
        });

        // Show success toast
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur ScaleUp!",
        });

        // Close modal and redirect based on user role
        onClose();

        // Attendre un court instant pour s'assurer que le modal est fermé
        setTimeout(() => {
          try {
            // Determine the correct path based on user role
            let dashboardPath = '/home';
            if (data.utilisateur.role === 'particulier') {
              dashboardPath = '/particulier/profile';
            } else if (data.utilisateur.role === 'startup') {
              dashboardPath = '/startup/profile';
            } else if (data.utilisateur.role === 'mentor') {
              dashboardPath = '/mentors/dashboard';
            }

            // Use window.location for navigation instead of wouter's setLocation
            window.location.href = dashboardPath;
          } catch (error) {
            console.error('Error during redirection:', error);
            // Fallback to home page if there's an error
            window.location.href = '/home';
          }
        }, 100);
      }
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
