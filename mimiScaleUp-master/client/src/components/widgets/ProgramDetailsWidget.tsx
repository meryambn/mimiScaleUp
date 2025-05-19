import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useProgramme } from '@/hooks/useProgramme';

interface ProgramDetailsWidgetProps {
  standalone?: boolean;
  isStartupInterface?: boolean;
}

const ProgramDetailsWidget: React.FC<ProgramDetailsWidgetProps> = ({
  standalone = false,
  isStartupInterface = false
}) => {
  const { programme, loading, error } = useProgramme();

  if (loading) {
    return (
      <Card className={standalone ? "mb-6" : ""}>
        <CardHeader>
          <CardTitle>Détails du Programme</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={standalone ? "mb-6" : ""}>
        <CardHeader>
          <CardTitle>Détails du Programme</CardTitle>
          <CardDescription>Erreur: {error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!programme) {
    return (
      <Card className={standalone ? "mb-6" : ""}>
        <CardHeader>
          <CardTitle>Détails du Programme</CardTitle>
          <CardDescription>Aucun programme sélectionné</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Veuillez sélectionner un programme pour voir ses détails.</p>
        </CardContent>
      </Card>
    );
  }

  // Vérifier si phases_requises est un tableau valide
  const phases = Array.isArray(programme.phases_requises) ? programme.phases_requises : [];

  return (
    <Card className={standalone ? "mb-6" : ""}>
      <CardHeader>
        <CardTitle>{programme.nom}</CardTitle>
        <CardDescription>{programme.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Date de début</p>
            <p>{new Date(programme.date_debut).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Date de fin</p>
            <p>{new Date(programme.date_fin).toLocaleDateString()}</p>
          </div>

          {/* Only show status for admin interface */}
          {!isStartupInterface && programme.status && (
            <div>
              <p className="text-sm font-medium text-gray-500">Statut</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`
                  px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${programme.status === "Brouillon"
                    ? "bg-gray-100 text-gray-800 border border-gray-300"
                    : programme.status === "Actif"
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-blue-100 text-blue-800 border border-blue-300"}
                `}>
                  {programme.status}
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-500">Type de programme</p>
            <p>{programme.type}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Taille d'équipe</p>
            <p>{programme.taille_equipe_min} - {programme.taille_equipe_max} membres</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Chiffre d'affaires</p>
            <p>{programme.ca_min}K - {programme.ca_max}K DA</p>
          </div>
        </div>

        {phases.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500 mb-2">Phases requises</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {phases.map((phase, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">Phase {index + 1}</span>
                  <span className="text-gray-500 ml-2">{phase}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(programme.industries_requises) && programme.industries_requises.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500 mb-2">Industries requises</p>
            <div className="flex flex-wrap gap-2">
              {programme.industries_requises.map((industry, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                  {industry}
                </span>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(programme.documents_requis) && programme.documents_requis.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500 mb-2">Documents requis</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {programme.documents_requis.map((document, index) => (
                <div key={index} className="text-sm">
                  <span className="text-gray-500">{document}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgramDetailsWidget;
