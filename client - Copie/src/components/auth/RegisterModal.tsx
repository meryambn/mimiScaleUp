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
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would make an API call to register the user
    console.log('Données du formulaire:', { ...formData, userType: selectedUserType });

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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, companyFile: e.target.files[0] });
    }
  };

  if (!show) return null;

  return (
    <>
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
                {/* Common fields */}
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Mot de passe</label>
                  <input
                    type="password"
                    required
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Confirmer le mot de passe</label>
                  <input
                    type="password"
                    required
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Téléphone mobile</label>
                  <input
                    type="tel"
                    required
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
                        onChange={(e) => setFormData({ ...formData, startupName: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Fichier de l'entreprise</label>
                      <input
                        type="file"
                        required
                        onChange={handleFileChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Site web</label>
                      <input
                        type="url"
                        placeholder="https://www.levelup.com/"
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Année de création</label>
                      <input
                        type="number"
                        placeholder="2010"
                        min="2010"
                        max="2025"
                        required
                        onChange={(e) => setFormData({ ...formData, creationYear: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Nombre d'employés</label>
                      <input
                        type="number"
                        min="1"
                        required
                        onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* Mentor-specific fields */}
                {selectedUserType === 'mentor' && (
                  <div className="form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      required
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                    <label>Prénom</label>
                    <input
                      type="text"
                      required
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                    <label>Profession</label>
                    <input
                      type="text"
                      required
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    />
                  </div>
                )}

                {/* Particulier-specific fields */}
                {selectedUserType === 'particulier' && (
                  <div className="form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      required
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                    <label>Prénom</label>
                    <input
                      type="text"
                      required
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                )}

                <button type="submit" className="cta-button">
                  S'inscrire
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
    </>
  );
};

export default RegisterModal;
