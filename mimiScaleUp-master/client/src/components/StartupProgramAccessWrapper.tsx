import React, { useState, useEffect } from 'react';
import StartupLayout from './layout/StartupLayout';
import { useToast } from '@/hooks/use-toast';
import { useProgramContext } from '@/context/ProgramContext';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { getNotifications } from '../services/notificationService';

interface StartupProgramAccessWrapperProps {
  children: React.ReactNode;
}

const StartupProgramAccessWrapper: React.FC<StartupProgramAccessWrapperProps> = ({ children }) => {
  const { toast } = useToast();
  const { selectedProgram, selectedProgramId } = useProgramContext();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [hasProgramAccess, setHasProgramAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si l'utilisateur a accès au programme (via une notification d'ajout au programme)
  useEffect(() => {
    const checkProgramAccess = async () => {
      if (user?.id && selectedProgramId) {
        try {
          setIsLoading(true);
          const notifications = await getNotifications(user.id, 'startup');
          
          // Rechercher une notification indiquant que la startup a été ajoutée au programme sélectionné
          const programAddedNotification = notifications.find(
            notification => 
              notification.related_id === Number(selectedProgramId) &&
              notification.message.includes('ajoutée au programme')
          );

          if (programAddedNotification) {
            setHasProgramAccess(true);
             toast({
               title: "Programme sélectionné",
               description: `Vous avez accès au programme ${selectedProgram?.name || ''}.`,
               variant: "success"
             });
          } else {
            setHasProgramAccess(false);
            toast({
              title: "Accès refusé",
              description: "Votre startup n'a pas encore été ajoutée à ce programme.",
              variant: "warning"
            });
          }
        } catch (error) {
          console.error('Error checking program access:', error);
          toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la vérification de votre accès au programme.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      } else if (!selectedProgramId) {
         // Si aucun programme n'est sélectionné du tout, on considère qu'il n'y a pas d'accès au programme.
         setHasProgramAccess(false);
         setIsLoading(false);
         // Pas de toast ici, il sera géré par l'interface affichée
      }
    };

    checkProgramAccess();
  }, [user?.id, selectedProgramId, selectedProgram?.name, toast]);

  // Si en cours de chargement, afficher un indicateur de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si aucun programme n'est sélectionné ou pas d'accès au programme, afficher l'interface de candidature/attente
  if (!selectedProgramId || !hasProgramAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Bienvenue sur votre espace Startup
          </h1>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-blue-700">
              {!selectedProgramId 
                ? "Pour accéder à votre tableau de bord, vous devez d'abord candidater à un programme."
                : "Votre startup n'a pas encore été ajoutée à ce programme. Veuillez candidater ou attendre d'être accepté."}
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-gray-600">
              Pour commencer votre aventure avec nous, suivez ces étapes :
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Consultez les programmes disponibles</li>
              <li>Choisissez le programme qui correspond à vos besoins</li>
              <li>Complétez le formulaire de candidature</li>
              <li>Attendez l'acceptation de votre startup dans un programme</li>
            </ol>
          </div>
          <button
            onClick={() => setLocation('/startup/apply')}
            className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Candidater maintenant
          </button>
        </div>
      </div>
    );
  }

  // Si tout est bon (programme sélectionné et accès validé), afficher les enfants (la page demandée)
  return <>{children}</>;
};

export default StartupProgramAccessWrapper; 