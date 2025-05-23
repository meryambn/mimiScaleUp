import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface AdminFormData {
  email: string;
  password: string;
  confirmPassword: string;
  nom: string;
  prenom: string;
  telephone: string;
  accelerator_name: string;
  location: string;
  year_founded: string;
  website: string;
  contact_info: string;
}

const AdminRegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<AdminFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    telephone: '',
    accelerator_name: '',
    location: '',
    year_founded: '',
    website: '',
    contact_info: '',
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

    // Required fields validation
    if (!formData.nom.trim()) {
      setError('Le nom est requis.');
      return false;
    }

    if (!formData.prenom.trim()) {
      setError('Le prénom est requis.');
      return false;
    }

    if (!formData.telephone.trim()) {
      setError('Le numéro de téléphone est requis.');
      return false;
    }

    if (!formData.accelerator_name.trim()) {
      setError('Le nom de l\'accélérateur est requis.');
      return false;
    }

    if (!formData.location.trim()) {
      setError('La localisation est requise.');
      return false;
    }

    // Phone validation (basic)
    if (formData.telephone.length < 10) {
      setError('Veuillez entrer un numéro de téléphone valide.');
      return false;
    }

    // Year validation
    if (formData.year_founded && (isNaN(Number(formData.year_founded)) || Number(formData.year_founded) < 1900 || Number(formData.year_founded) > new Date().getFullYear())) {
      setError('Veuillez entrer une année de fondation valide.');
      return false;
    }

    // Website validation (if provided)
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      setError('Veuillez entrer une URL valide pour le site web (commençant par http:// ou https://).');
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

      // Prepare profile data
      const profileData = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        telephone: formData.telephone.trim(),
        accelerator_name: formData.accelerator_name.trim(),
        location: formData.location.trim(),
        year_founded: formData.year_founded ? parseInt(formData.year_founded) : null,
        website: formData.website.trim() || '',
        contact_info: formData.contact_info.trim() || '',
        photo: '/default-avatar.jpg',
        biographie: ''
      };

      // Send admin registration request
      const response = await fetch('http://localhost:8083/api/auth/register-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          motDePasse: formData.password,
          profileData: profileData
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
          // Create admin user object using the actual admin ID from login response
          const adminUser = {
            id: loginData.adminId || responseData.adminId || 1,
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

          // Redirect to admin dashboard
          setTimeout(() => {
            console.log('Redirecting to admin dashboard');
            window.location.href = '/admin/dashboard';
          }, 1000);
        } else {
          // If auto-login fails, redirect to login page
          toast({
            title: "Inscription réussie",
            description: "Veuillez vous connecter avec vos identifiants",
          });
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        }
      } catch (loginError) {
        console.error('Auto-login failed:', loginError);
        // If auto-login fails, redirect to login page
        toast({
          title: "Inscription réussie",
          description: "Veuillez vous connecter avec vos identifiants",
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }

      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        nom: '',
        prenom: '',
        telephone: '',
        accelerator_name: '',
        location: '',
        year_founded: '',
        website: '',
        contact_info: '',
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

  return (
    <div className="admin-register-page">
      <style>{`
        .admin-register-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #e43e32 0%, #0c4c80 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .register-container {
          background: white;
          border-radius: 20px;
          padding: 3rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          max-width: 500px;
          width: 100%;
          text-align: center;
        }

        .welcome-section {
          margin-bottom: 2rem;
        }

        .welcome-section h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #e43e32 0%, #0c4c80 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
        }

        .welcome-section p {
          font-size: 1.1rem;
          color: #666;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .highlight-text {
          color: #e43e32;
          font-weight: 600;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          text-align: left;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 500;
          color: #333;
        }

        .form-group input {
          padding: 1rem;
          border: 2px solid #e1e5e9;
          border-radius: 10px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #e43e32;
        }

        .submit-button {
          background: linear-gradient(135deg, #e43e32 0%, #0c4c80 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(228, 62, 50, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .error-message {
          color: #e43e32;
          background: #fef2f2;
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid #fecaca;
          font-size: 0.9rem;
        }

        .loading-message {
          color: #0c4c80;
          background: #f0f9ff;
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid #bae6fd;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .register-container {
            padding: 2rem;
            margin: 1rem;
          }

          .welcome-section h1 {
            font-size: 2rem;
          }
        }
      `}</style>

      <div className="register-container">
        <div className="welcome-section">
          <h1>Bienvenue sur ScaleUp</h1>
          <p>
            La plateforme qui va <span className="highlight-text">accompagner votre accélérateur</span>
            dans la transformation digitale de l'écosystème entrepreneurial.
          </p>
          <p>
            Créez votre compte administrateur pour commencer à gérer vos programmes,
            mentors et startups en toute simplicité.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading-message">Création du compte en cours...</div>}

          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              placeholder="admin@votre-accelerateur.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
              placeholder="Minimum 6 caractères"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={loading}
              placeholder="Répétez votre mot de passe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prenom">Prénom *</label>
            <input
              id="prenom"
              type="text"
              required
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              disabled={loading}
              placeholder="Votre prénom"
            />
          </div>

          <div className="form-group">
            <label htmlFor="nom">Nom *</label>
            <input
              id="nom"
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              disabled={loading}
              placeholder="Votre nom"
            />
          </div>

          <div className="form-group">
            <label htmlFor="telephone">Téléphone *</label>
            <input
              id="telephone"
              type="tel"
              required
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              disabled={loading}
              placeholder="+213 XX XX XX XX"
            />
          </div>

          <div className="form-group">
            <label htmlFor="accelerator_name">Nom de l'accélérateur *</label>
            <input
              id="accelerator_name"
              type="text"
              required
              value={formData.accelerator_name}
              onChange={(e) => setFormData({ ...formData, accelerator_name: e.target.value })}
              disabled={loading}
              placeholder="Nom de votre accélérateur"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Localisation *</label>
            <input
              id="location"
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              disabled={loading}
              placeholder="Alger, Algérie"
            />
          </div>

          <div className="form-group">
            <label htmlFor="year_founded">Année de fondation</label>
            <input
              id="year_founded"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.year_founded}
              onChange={(e) => setFormData({ ...formData, year_founded: e.target.value })}
              disabled={loading}
              placeholder="2020"
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Site web</label>
            <input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              disabled={loading}
              placeholder="https://votre-accelerateur.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact_info">Informations de contact</label>
            <textarea
              id="contact_info"
              rows={3}
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              disabled={loading}
              placeholder="Informations supplémentaires de contact..."
              style={{
                padding: '1rem',
                border: '2px solid #e1e5e9',
                borderRadius: '10px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '80px'
              }}
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer mon compte administrateur'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
