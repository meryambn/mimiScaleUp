import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { FaCamera, FaTrash, FaStar, FaBell, FaCog } from 'react-icons/fa';
import { FiLogOut } from "react-icons/fi";
import PasswordPopup from './PasswordPopup';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  'Nom complet': string;
  'Email': string;
  'Téléphone': string;
  'Site web': string;
  "Nombre d'employés": string;
  'Année de création': string;
}

interface TeamMember {
  matricule: string;
  name: string;
  position: string;
}

interface Comment {
  author?: string;
  text: string;
  date: string;
}

interface ApiResponse {
  nom_entreprise: string;
  email: string;
  telephone: string;
  site_web: string;
  nombre_employes: string;
  annee_creation: string;
  stage?: string;
  equipe?: Array<{
    matricule: string;
    nom: string;
    prenom: string;
  }>;
}

const Profile: React.FC = () => {
  const [profilePhoto, setProfilePhoto] = useState<string>('/default-avatar.jpg');
  const [profileData, setProfileData] = useState<ProfileData>({
    'Nom complet': 'Chargement...',
    'Email': 'Chargement...',
    'Téléphone': 'Chargement...',
    'Site web': 'Chargement...',
    "Nombre d'employés": 'Chargement...',
    'Année de création': 'Chargement...'
  });
  const [showPasswordPopup, setShowPasswordPopup] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [stage, setStage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [equipeSuccess, setEquipeSuccess] = useState<string | null>(null);
  const [equipeError, setEquipeError] = useState<string | null>(null);
  const [stageSuccess, setStageSuccess] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);

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

        const response = await fetch(`http://localhost:8083/api/profile/startup/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || 'Erreur lors de la récupération des données');
        }

        const data: ApiResponse = await response.json();
        console.log('Données reçues:', data);
        setApiData(data);

        setProfileData({
          'Nom complet': data.nom_entreprise || 'Non renseigné',
          'Email': data.email || 'Non renseigné',
          'Téléphone': data.telephone || 'Non renseigné',
          'Site web': data.site_web || 'Non renseigné',
          "Nombre d'employés": data.nombre_employes || 'Non renseigné',
          'Année de création': data.annee_creation || 'Non renseigné'
        });

        if (data.stage) {
          setStage(data.stage);
        }

        if (data.equipe && data.equipe.length > 0) {
          setTeamMembers(data.equipe.map(member => ({
            matricule: member.matricule,
            name: member.nom,
            position: member.prenom
          })));
        } else {
          setTeamMembers([{ matricule: '', name: '', position: '' }]);
        }

      } catch (err) {
        console.error('Erreur:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePhoto(result);
        localStorage.setItem('profilePhoto', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoDelete = () => {
    if (window.confirm('Supprimer la photo de profil ?')) {
      setProfilePhoto('/default-avatar.jpg');
      localStorage.removeItem('profilePhoto');
    }
  };

  const handleRating = (value: number) => {
    setRating(value);
    localStorage.setItem('userRating', value.toString());
  };

  const handleAddComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newComment.trim()) {
      const updatedComments = [
        ...comments,
        {
          text: newComment.trim(),
          date: new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
        },
      ];
      setComments(updatedComments);
      localStorage.setItem('comments', JSON.stringify(updatedComments));
      setNewComment('');
    }
  };

  const handleAddMember = () => {
    const maxEmployees = Number(profileData["Nombre d'employés"]) || 0;

    if (teamMembers.length >= maxEmployees) {
      alert(`Vous ne pouvez pas ajouter plus de ${maxEmployees} membres d'équipe.`);
      return;
    }

    setTeamMembers([...teamMembers, { matricule: '', name: '', position: '' }]);
  };

  const handleRemoveMember = (index: number) => {
    if (teamMembers.length > 1) {
      const newMembers = [...teamMembers];
      newMembers.splice(index, 1);
      setTeamMembers(newMembers);
    }
  };

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const newMembers = [...teamMembers];
    newMembers[index][field] = value;
    setTeamMembers(newMembers);
  };

  const handleSubmitEquipe = async () => {
    try {
      setIsSubmitting(true);
      setEquipeError(null);
      setEquipeSuccess(null);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié');
      }

      const validMembers = teamMembers.filter(member =>
        member.matricule && member.name && member.position
      );

      if (validMembers.length === 0) {
        throw new Error('Veuillez remplir au moins un membre valide');
      }

      const response = await fetch(`http://localhost:8083/api/profile/startup/${user.id}/equipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          members: validMembers.map(member => ({
            matricule: member.matricule,
            nom: member.name,
            prenom: member.position
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Erreur lors de l\'enregistrement de l\'équipe');
      }

      setEquipeSuccess('Équipe enregistrée avec succès!');
      setTimeout(() => setEquipeSuccess(null), 10000);
    } catch (err) {
      console.error('Erreur:', err);
      setEquipeError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    try {
      // Clear all authentication data from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('role');

      console.log('Déconnexion réussie');

      // Redirect to home page
      window.location.href = '/home';
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  };

  const handleSubmitStage = async () => {
    try {
      if (!stage) {
        throw new Error('Veuillez sélectionner un stage');
      }

      setIsSubmitting(true);
      setStageError(null);
      setStageSuccess(null);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié');
      }

      const response = await fetch(`http://localhost:8083/api/profile/startup/${user.id}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ stage })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Erreur lors de l\'enregistrement du stage');
      }

      setStageSuccess('Stage enregistré avec succès!');
      setTimeout(() => setStageSuccess(null), 10000);
    } catch (err) {
      console.error('Erreur:', err);
      setStageError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>Erreur: {error}</div>;
  }

  return (
    <div className="profile-page">
    <div className="profile-container">
      {/* Barre de navigation */}
      <nav className="navbar">
        <div className="nav-links">
          <Link to="/startup/dashboard">Dashboard</Link>
        </div>

        <img
          src="/ScaleUp_Logo_-_Original_with_Transparent_Background_-_5000x5000.png"
          className="logo"
          alt="ScaleUp Logo"
        />

        <div className="nav-links">
          <Link to="/startup/notifications" className="notification-link">
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

              {/* Section Stage */}
              <div className="stage-selection">
                <h3>Stage de votre startup</h3>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="stage-select"
                >
                  <option value="">Sélectionnez votre stage</option>
                  <option value="Idéation">1/ Idéation</option>
                  <option value="Pré-MVP">2/ Pré-MVP</option>
                  <option value="MVP">3/ MVP</option>
                  <option value="Growth">4/ Growth</option>
                  <option value="Scaling">5/ Scaling</option>
                </select>

                {stageError && <div className="error-message">{stageError}</div>}
                {stageSuccess && <div className="success-message">{stageSuccess}</div>}

                <button
                  type="button"
                  className="btn-primary stage-submit-btn"
                  disabled={!stage || isSubmitting}
                  onClick={handleSubmitStage}
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
                </button>
              </div>

              {/* Section Membres d'équipe */}
              <div className="team-members-section">
                <h3>Membres de l'équipe ({teamMembers.length}/{profileData["Nombre d'employés"] || 0})</h3>

                {equipeError && <div className="error-message">{equipeError}</div>}
                {equipeSuccess && <div className="success-message">{equipeSuccess}</div>}

                <div className="members-list">
                  {teamMembers.map((member, index) => (
                    <div className="member-item" key={index}>
                      <input
                        type="number"
                        placeholder="Matricule"
                        value={member.matricule}
                        onChange={(e) => handleMemberChange(index, 'matricule', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Nom"
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Prénom"
                        value={member.position}
                        onChange={(e) => handleMemberChange(index, 'position', e.target.value)}
                      />
                      <button
                        type="button"
                        className="remove-member-btn"
                        onClick={() => handleRemoveMember(index)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="team-actions">
                  <button
                    type="button"
                    className="add-member-btn"
                    onClick={handleAddMember}
                  >
                    + Ajouter un membre
                  </button>
                  <button
                    type="button"
                    className="add-member-btn1"
                    onClick={handleSubmitEquipe}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer l\'équipe'}
                  </button>
                </div>
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
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div className="comment" key={index}>
                      <p><strong>{comment.author}</strong> {comment.text}</p>
                      <small>{comment.date}</small>
                    </div>
                  ))
                ) : (
                  <p></p>
                )}
              </div>

              <form className="comment-form" onSubmit={handleAddComment}>
                <textarea
                  placeholder="Ajouter..."
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary">
                  Envoyer
                </button>
              </form>
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
          background: var(--primary);
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

        /* Section Membres d'équipe */
        .team-members-section {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #eee;
        }

        .members-list {
          margin: 1rem 0;
        }

        .member-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          align-items: center;
        }

        .member-item input {
          flex: 1;
          padding: 0.8rem;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .remove-member-btn {
          background: #ffebee;
          color: #d32f2f;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .remove-member-btn:hover {
          background: #ffcdd2;
        }

        .add-member-btn {
          background: #e8f5e9;
          color: #2e7d32;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .add-member-btn:hover {
          background: #c8e6c9;
        }

        .add-member-btn1 {
          background: rgb(245, 232, 232);
          color: rgb(132, 22, 0);
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .team-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        input[type=number] {
          -moz-appearance: textfield;
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .add-member-btn1:hover {
          background: rgb(245, 198, 198);
        }

        /* Section Stage */
        .stage-selection {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #eee;
        }

        .stage-select {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin: 1rem 0;
          background-color: white;
        }

        .stage-select:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 5px rgba(228, 62, 50, 0.3);
        }

        .stage-submit-btn {
          width: auto;
          padding: 0.8rem 2rem;
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

          .navbar {
            flex-direction: column;
            height: auto;
            padding: 1rem;
          }
            .notification-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          color: var(--dark-text);
          transition: var(--transition);
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
          .nav-links {
            width: 100%;
            justify-content: space-between;
            margin: 0.5rem 0;
          }

          .member-item {
            flex-direction: column;
            align-items: stretch;
          }

          .team-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;