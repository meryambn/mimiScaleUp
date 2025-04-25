import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface LoginModalProps {
  show: boolean;
  onClose: () => void;
  switchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ show, onClose, switchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Add login logic here
      await login(email, password);
      console.log('Email:', email, 'Password:', password);
      onClose();
      setLocation('/dashboard');
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur ScaleUp!",
      });
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    }
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
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="cta-button">
            Se connecter
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
