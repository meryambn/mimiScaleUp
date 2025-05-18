import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { createFormAccessNotification } from '@/services/notificationService';
import { getProgram } from '@/services/programService';

const ApplyRedirect: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const params = useParams();
  const programId = params?.id;
  const [isLoading, setIsLoading] = useState(true);
  const [programName, setProgramName] = useState<string | null>(null);

  useEffect(() => {
    const handleFormAccess = async () => {
      if (!programId) {
        setIsLoading(false);
        return;
      }

      try {
        // Get program details to include name in notification
        const program = await getProgram(programId);

        if (program) {
          setProgramName(program.nom);
        }

        // If user is logged in, create a notification and redirect
        if (user?.id && user?.role) {
          if (program) {
            // Create notification for form access
            await createFormAccessNotification(
              user.id,
              user.role,
              programId,
              program.nom
            );
          }

          // Redirect to the appropriate form based on user role
          if (user.role === 'startup') {
            setLocation(`/startup/apply/${programId}`);
          } else if (user.role === 'particulier') {
            setLocation(`/particulier/apply/${programId}`);
          } else if (user.role === 'admin' || user.role === 'mentor') {
            setLocation(`/admin/applications`);
          } else {
            setLocation('/home');
          }
        } else {
          // User is not logged in, show login required message
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error handling form access:', error);
        setIsLoading(false);
      }
    };

    handleFormAccess();
  }, [user, programId, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-blue-500 text-center mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-center mb-4">Information</h2>
        <p className="text-gray-600 text-center mb-6">
          Vous devez être connecté pour accéder à ce formulaire
          {programName ? (
            <span className="block mt-2 text-sm">Programme: {programName}</span>
          ) : programId ? (
            <span className="block mt-2 text-sm">Programme ID: {programId}</span>
          ) : null}
        </p>
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => setLocation('/login')}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Se connecter
          </button>
          <button
            onClick={() => setLocation('/home')}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyRedirect;
