import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SavedProgramTemplate } from '@/types/program';
import { getSavedProgramTemplates, deleteProgramTemplate } from '@/utils/programTemplates';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Trash2, Plus, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProgramContext } from '@/context/ProgramContext';

const ProgramTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<SavedProgramTemplate[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { createProgram } = useProgramContext();

  // Charger les modèles au chargement de la page
  useEffect(() => {
    const loadedTemplates = getSavedProgramTemplates();
    setTemplates(loadedTemplates);
  }, []);

  // Supprimer un modèle
  const handleDeleteTemplate = (templateId: string) => {
    const success = deleteProgramTemplate(templateId);
    if (success) {
      setTemplates(templates.filter(template => template.id !== templateId));
      toast({
        title: "Modèle supprimé",
        description: "Le modèle a été supprimé avec succès.",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du modèle.",
        variant: "destructive",
      });
    }
  };

  // Utiliser un modèle pour créer un nouveau programme
  const handleUseTemplate = (template: SavedProgramTemplate) => {
    try {
      // Créer un nouveau programme à partir du modèle
      const programId = createProgram({
        ...template.programData,
        name: `${template.programData.name} (copie)`,
      });

      toast({
        title: "Programme créé",
        description: "Un nouveau programme a été créé à partir du modèle.",
      });

      // Rediriger vers le tableau de bord du nouveau programme
      setLocation(`/programs/${programId}`);
    } catch (error) {
      console.error("Error creating program from template:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du programme.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Modèles de programme</h1>
            <p className="text-gray-500 mt-1">
              Gérez vos modèles de programme personnalisés
            </p>
          </div>
          <div className="flex space-x-4">
            <Button onClick={() => setLocation('/programs')}>
              Retour aux programmes
            </Button>
            <Button onClick={() => setLocation('/programs/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau programme
            </Button>
          </div>
        </div>

        {templates.length === 0 ? (
          <Card className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <CardContent className="pt-6">
              <p className="text-gray-500 mb-4">Aucun modèle de programme enregistré</p>
              <Button variant="outline" onClick={() => setLocation('/programs/create')}>
                Créer votre premier programme
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    Créé le {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-700 line-clamp-3">
                    {template.programData.phases?.length || 0} phases
                    {template.programData.mentors?.length ? `, ${template.programData.mentors.length} mentors` : ''}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action ne peut pas être annulée. Le modèle sera définitivement supprimé.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Button onClick={() => handleUseTemplate(template)}>
                    <Copy className="h-4 w-4 mr-1" />
                    Utiliser
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramTemplates;
