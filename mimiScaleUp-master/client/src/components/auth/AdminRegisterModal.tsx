import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface AdminRegisterModalProps {
  show: boolean;
  onClose: () => void;
  switchToLogin: () => void;
}

interface AdminFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const AdminRegisterModal: React.FC<AdminRegisterModalProps> = ({ show, onClose, switchToLogin }) => {
  const [formData, setFormData] = useState<AdminFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { setUser } = useAuth();

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

    try {
      console.log('Sending admin registration data');

      // Send admin registration request
      const response = await fetch('http://localhost:8083/api/auth/register-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          motDePasse: formData.password,
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        const serverError = responseData.error ||
                          responseData.message ||
                          `Erreur serveur (code ${response.status})`;
        throw new Error(serverError);
      }

      toast({
        title: "Inscription admin réussie",
        description: "Votre compte administrateur a été créé avec succès",
      });

      // Automatically log in the admin after successful registration
      try {
        console.log('Attempting automatic admin login after registration');

        // Add a small delay to ensure the backend has processed the registration
        await new Promise(resolve => setTimeout(resolve, 500));

        // Make login request with the same credentials
        const loginResponse = await fetch('http://localhost:8083/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            motDePasse: formData.password,
          }),
        });

        const loginData = await loginResponse.json();
        console.log('Admin login response:', loginData);

        if (loginResponse.ok && loginData.message === 'connexion admin reussie') {
          // Create admin user object
          const adminUser = {
            id: responseData.adminId || 1,
            name: loginData.email,
            email: loginData.email,
            role: 'admin' as const,
            profileImage: '',
            token: 'admin-token'
          };

          console.log('Setting admin user in context and localStorage:', adminUser);

          // Store admin data in localStorage
          localStorage.setItem('user', JSON.stringify(adminUser));
          localStorage.setItem('role', 'admin');
          localStorage.setItem('token', 'admin-token');

          // Update the auth context with admin data
          setUser(adminUser);

          // Show success toast for admin
          toast({
            title: "Connexion automatique réussie",
            description: "Bienvenue sur le panneau d'administration!",
          });

          // Close modal and redirect to admin dashboard
          onClose();

          // Redirect to admin dashboard
          setTimeout(() => {
            console.log('Redirecting to admin dashboard');
            window.location.href = '/admin/dashboard';
          }, 1000);
        } else {
          // If auto-login fails, just show success message and switch to login
          toast({
            title: "Inscription réussie",
            description: "Veuillez vous connecter avec vos identifiants",
          });
          switchToLogin();
        }
      } catch (loginError) {
        console.error('Auto-login failed:', loginError);
        // If auto-login fails, just show success message and switch to login
        toast({
          title: "Inscription réussie",
          description: "Veuillez vous connecter avec vos identifiants",
        });
        switchToLogin();
      }

      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
      });

    } catch (err: any) {
      console.error('Erreur lors de l\'inscription admin:', err);

      if (err.message.includes('email')) {
        setError('Cet email est déjà utilisé. Veuillez en choisir un autre.');
      } else if (err.message.includes('validation')) {
        setError('Données invalides. Vérifiez les informations saisies.');
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Erreur de connexion au serveur. Vérifiez que le serveur backend est en cours d\'exécution.');
      } else {
        setError(err.message || 'Une erreur est survenue lors de l\'inscription.');
      }

      toast({
        title: "Erreur d'inscription admin",
        description: err.message || 'Une erreur est survenue lors de l\'inscription.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Créer un compte Administrateur</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="error-message">{error}</p>}
          {loading && <p className="loading-message">Chargement...</p>}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={loading}
            />
          </div>

          <button type="submit" className="cta-button" disabled={loading}>
            {loading ? 'Inscription en cours...' : 'Créer le compte admin'}
          </button>
        </form>

        <div className="auth-redirect">
          <p>Déjà un compte ?
            <button className="link-button" onClick={switchToLogin}>
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterModal;
