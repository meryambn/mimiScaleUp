import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { FaCamera, FaTrash, FaStar, FaBell, FaCog } from 'react-icons/fa';
import { FiLogOut } from "react-icons/fi";
import PasswordPopup from './PasswordPopup';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  'Nom': string;
  'Prénom': string;
  'Email': string;
  'Téléphone': string;
  'Nom de l\'Accélérateur': string;
  'Localisation': string;
  'Année de Fondation': string;
  'Site Web': string;
  'Informations de Contact': string;
}

interface Comment {
  author?: string;
  text: string;
  date: string;
}

interface ApiResponse {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  photo: string;
  biographie: string;
  accelerator_name: string;
  location: string;
  year_founded: number | null;
  website: string;
  contact_info: string;
}

const AdminProfile: React.FC = () => {
  const [profilePhoto, setProfilePhoto] = useState<string>('/default-avatar.jpg');
  const [profileData, setProfileData] = useState<ProfileData>({
    'Nom': 'Chargement...',
    'Prénom': 'Chargement...',
    'Email': 'Chargement...',
    'Téléphone': 'Chargement...',
    'Nom de l\'Accélérateur': 'Chargement...',
    'Localisation': 'Chargement...',
    'Année de Fondation': 'Chargement...',
    'Site Web': 'Chargement...',
    'Informations de Contact': 'Chargement...'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [biographie, setBiographie] = useState<string>('');
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biographieError, setBiographieError] = useState<string | null>(null);
  const [biographieSuccess, setBiographieSuccess] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);

  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user?.id) {
          throw new Error('Utilisateur non authentifié');
        }

        const response = await fetch(`http://localhost:8083/api/profile/admin/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Profil administrateur non trouvé');
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `Erreur HTTP: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        console.log('Données reçues:', data);
        setApiData(data);

        setProfileData({
          'Nom': data.nom || 'Non renseigné',
          'Prénom': data.prenom || 'Non renseigné',
          'Email': data.email || 'Non renseigné',
          'Téléphone': data.telephone || 'Non renseigné',
          'Nom de l\'Accélérateur': data.accelerator_name || 'Non renseigné',
          'Localisation': data.location || 'Non renseigné',
          'Année de Fondation': data.year_founded ? data.year_founded.toString() : 'Non renseigné',
          'Site Web': data.website || 'Non renseigné',
          'Informations de Contact': data.contact_info || 'Non renseigné'
        });

        // Affichage de la photo de profil depuis la BDD si elle existe
        if (data.photo && data.photo !== '/default-avatar.jpg') {
          setProfilePhoto(`http://localhost:8083${data.photo}`);
        } else {
          setProfilePhoto('/default-avatar.jpg');
        }

        // Set biography
        setBiographie(data.biographie || '');

      } catch (err) {
        console.error('Erreur:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        setProfilePhoto('/default-avatar.jpg');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user?.id) {
          throw new Error('Utilisateur non authentifié');
        }

        const formData = new FormData();
        formData.append('photo', file);

        const response = await fetch(`http://localhost:8083/api/profile/admin/${user.id}/photo`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de l\'upload de la photo');
        }

        const result = await response.json();
        setProfilePhoto(`http://localhost:8083${result.photo}`);

        toast({
          title: "Succès",
          description: "Photo de profil mise à jour!",
        });

      } catch (error) {
        console.error('Error uploading photo:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de l'upload de la photo",
          variant: "destructive",
        });
      }
    }
  };

  const handlePhotoDelete = async () => {
    if (window.confirm('Supprimer la photo de profil ?')) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user?.id) {
          throw new Error('Utilisateur non authentifié');
        }

        const response = await fetch(`http://localhost:8083/api/profile/admin/${user.id}/photo`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ photo: '/default-avatar.jpg' })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la suppression de la photo');
        }

        setProfilePhoto('/default-avatar.jpg');

        toast({
          title: "Succès",
          description: "Photo de profil supprimée!",
        });

      } catch (error) {
        console.error('Error deleting photo:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression de la photo",
          variant: "destructive",
        });
      }
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/home';
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  };

  const handleSubmitBiographie = async () => {
    try {
      if (!newComment.trim()) {
        throw new Error('La biographie ne peut pas être vide');
      }

      setIsSubmitting(true);
      setBiographieError(null);
      setBiographieSuccess(null);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié');
      }

      const response = await fetch(`http://localhost:8083/api/profile/admin/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ biographie: newComment.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de la biographie');
      }

      setBiographie(newComment.trim());
      setNewComment('');
      setBiographieSuccess('Biographie mise à jour avec succès!');

      toast({
        title: "Succès",
        description: "Biographie mise à jour avec succès!",
      });

    } catch (error) {
      console.error('Error updating biography:', error);
      setBiographieError(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRating = (star: number) => {
    setRating(star);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erreur</h2>
        <p>{error}</p>
        <p>
          Si vous n'êtes pas un administrateur, veuillez vous connecter avec un compte administrateur ou contacter l'administrateur.
        </p>
        <button
          onClick={() => window.location.href = '/home'}
          className="btn-primary"
          style={{ maxWidth: '200px', margin: '20px auto' }}
        >
          Retour à l'accueil
        </button>
        <style jsx>{`
          .error-container {
            max-width: 600px;
            margin: 100px auto;
            padding: 30px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          h2 {
            color: #e43e32;
            margin-bottom: 20px;
          }
          p {
            margin-bottom: 15px;
            color: #333;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="profile-page profile-page-container">
      <div className="profile-container">
        {/* Barre de navigation */}
        <nav className="navbar">
          <div className="nav-links">
            <Link to="/admin/dashboard">Dashboard</Link>
          </div>

          <img
            src="/ScaleUp_Logo_-_Original_with_Transparent_Background_-_5000x5000.png"
            className="logo"
            alt="ScaleUp Logo"
          />

          <div className="nav-links">
            <Link to="/admin/notifications" className="notification-link">
              <FaBell />
              <span className="notification-badge"></span>
            </Link>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setShowPasswordPopup(true)}
              className="nav-link-button"
            >
              <FaCog />
            </button>
            <div
              onClick={handleLogout}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#e43e32'
              }}
            >
              <FiLogOut size={18} />
              <span>Déconnexion</span>
            </div>
            <Link className="active">Mon Profil</Link>
          </div>
        </nav>

        {/* Section principale */}
        <section className="profile-section">
          <div className="profile-header">
            <div className="avatar-container">
              <div className="avatar-card">
                <div className="avatar-inner">
                  <div className="avatar-front">
                    <img src={profilePhoto} alt="Profile" />
                  </div>
                  <div className="avatar-back">
                    <div className="avatar-actions">
                      <label className="avatar-btn change-btn">
                        <FaCamera /> Changer
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <button
                        className="avatar-btn delete-btn"
                        onClick={handlePhotoDelete}
                      >
                        <FaTrash /> Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-content">
            {/* Formulaire d'informations */}
            <form className="user-info-card">
              <h2>Informations du profil</h2>
              <div className="info-grid">
                {Object.entries(profileData).map(([label, value]) => (
                  <div className="info-item" key={label}>
                    <label>{label}</label>
                    <div className="editable-input">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </form>

            {/* Section commentaires et évaluation */}
            <div className="comments-section">
              <div className="rating-section">
                <h3>Note de ce profil</h3>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={rating >= star ? 'active' : ''}
                      onClick={() => handleRating(star)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </div>
                <small className="rating-text">
                  {rating
                    ? ['Très mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent'][rating - 1]
                    : 'Cliquez pour noter'}
                </small>
              </div>

              <h2>Votre Biographie</h2>
              <div className="comments-list">
                {biographie ? (
                  <div className="comment">
                    <p>{biographie}</p>
                    <small>Dernière mise à jour</small>
                  </div>
                ) : (
                  <p>Aucune biographie disponible</p>
                )}
              </div>

              {!biographie && (
                <form className="comment-form" onSubmit={(e) => { e.preventDefault(); handleSubmitBiographie(); }}>
                  <textarea
                    placeholder="Écrivez votre biographie..."
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                  {biographieError && <div className="error-message">{biographieError}</div>}
                  {biographieSuccess && <div className="success-message">{biographieSuccess}</div>}
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting || !newComment.trim()}
                  >
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer la biographie'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>

      <PasswordPopup
        isOpen={showPasswordPopup}
        onClose={() => setShowPasswordPopup(false)}
      />

      <style jsx>{`
        .profile-page {
          min-height: 100vh;
          background-color: #f5f5f5;
        }

        .profile-container {
          font-family: 'Montserrat', sans-serif;
          --primary: #e43e32;
          --secondary: #0c4c80;
          --light-gray: #f8f9fa;
          --clean-white: #ffffff;
          --dark-text: #2c3e50;
          --shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          --transition: all 0.3s ease;
        }

        .navbar {
          position: fixed;
          width: 100%;
          padding: 1.5rem 5%;
          background: var(--clean-white);
          box-shadow: var(--shadow);
          z-index: 1000;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 80px;
        }

        .logo {
          width: 150px;
          transition: transform 0.4s ease;
        }

        .logo:hover {
          transform: scale(1.05);
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-links a {
          text-decoration: none;
          color: var(--dark-text);
          font-weight: 600;
          transition: var(--transition);
        }

        .nav-links a.active {
          color: var(--primary);
        }

        .nav-links a:hover {
          color: var(--primary);
        }

        .nav-link-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          color: var(--dark-text);
          font-weight: 600;
          transition: var(--transition);
        }

        .nav-link-button:hover {
          color: var(--primary);
        }

        .notification-link {
          position: relative;
          text-decoration: none;
          color: var(--dark-text);
          font-weight: 600;
          transition: var(--transition);
        }

        .profile-section {
          padding: 8rem 5% 3rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .profile-header {
          position: relative;
          height: 150px;
          background: linear-gradient(to right, #000428, #004e92);
          border-radius: 8px;
          margin-bottom: 4rem;
        }

        .avatar-container {
          position: absolute;
          bottom: -50px;
          left: 50px;
        }

        .avatar-card {
          width: 140px;
          height: 140px;
          perspective: 1000px;
        }

        .avatar-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s;
          transform-style: preserve-3d;
          border-radius: 50%;
          box-shadow: var(--shadow);
          border: 3px solid white;
        }

        .avatar-card:hover .avatar-inner {
          transform: rotateY(180deg);
        }

        .avatar-front,
        .avatar-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 50%;
          overflow: hidden;
        }

        .avatar-front img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-back {
          background: var(--light-gray);
          transform: rotateY(180deg);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .avatar-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 80%;
        }

        .avatar-btn {
          padding: 0.5rem;
          border: none;
          border-radius: 20px;
          font-size: 0.7rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          transition: var(--transition);
        }

        .change-btn {
          background: white;
        }

        .delete-btn {
          background: rgba(255, 255, 255, 0.8);
          color: var(--primary);
        }

        .profile-content {
          display: flex;
          gap: 2rem;
          margin-top: 3rem;
        }

        .user-info-card {
          flex: 1;
          background: var(--clean-white);
          padding: 2rem;
          border-radius: 8px;
          box-shadow: var(--shadow);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .info-item label {
          font-weight: 600;
          color: var(--primary);
          font-size: 0.9rem;
        }

        .editable-input {
          background: var(--light-gray);
          padding: 0.8rem;
          border-radius: 8px;
          border: 1px solid #ddd;
          width: 100%;
          transition: var(--transition);
        }

        .editable-input:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 5px rgba(228, 62, 50, 0.3);
        }

        .btn-primary {
          background: linear-gradient(to right, #e43e32, #f37335);
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
          width: 100%;
          transition: var(--transition);
        }

        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }

        .comments-section {
          width: 350px;
          background: var(--clean-white);
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
        }

        .rating-section {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .stars {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin: 1rem 0;
          color: #ddd;
          font-size: 1.5rem;
        }

        .stars .active {
          color: #ffd700;
        }

        .rating-text {
          display: block;
          color: var(--primary);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .comments-list {
          flex: 1;
          overflow-y: auto;
          max-height: 300px;
          margin-bottom: 1rem;
        }

        .comment {
          background: var(--light-gray);
          padding: 0.8rem;
          border-radius: 8px;
          margin-bottom: 0.8rem;
        }

        .comment small {
          color: #666;
          font-size: 0.8rem;
        }

        .comment-form textarea {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          resize: none;
          margin-bottom: 0.8rem;
          min-height: 80px;
        }

        /* Messages d'erreur et succès */
        .error-message {
          color: #d32f2f;
          background-color: #ffebee;
          padding: 0.8rem;
          border-radius: 8px;
          margin: 0.5rem 0;
          font-size: 0.9rem;
        }

        .success-message {
          color: #2e7d32;
          background-color: #e8f5e9;
          padding: 0.8rem;
          border-radius: 8px;
          margin: 0.5rem 0;
          font-size: 0.9rem;
        }

        .notification-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: var(--primary);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .notification-link:hover {
          color: var(--primary);
        }

        @media (max-width: 992px) {
          .profile-content {
            flex-direction: column;
          }

          .comments-section {
            width: 100%;
            margin-top: 2rem;
          }
        }

        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
          }

          .nav-links {
            width: 100%;
            justify-content: space-between;
            margin: 0.5rem 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminProfile;
