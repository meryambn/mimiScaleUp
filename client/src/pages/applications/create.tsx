import React, { useState, useEffect } from "react";
import SimpleApplicationFormBuilder, { FormQuestion } from "@/components/application/SimpleApplicationFormBuilder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InsertApplicationForm } from "@shared/schema";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useProgramContext } from "@/context/ProgramContext";
import { saveFormDirect } from "@/utils/directStorage";

// Form settings are used in the form content object below
// in the handleSaveForm function

const CreateApplicationForm: React.FC = () => {
  const { selectedProgramId, selectedProgram } = useProgramContext();
  const [programId, setProgramId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Utiliser le programme sélectionné
  useEffect(() => {
    if (selectedProgramId) {
      setProgramId(Number(selectedProgramId));
    }
  }, [selectedProgramId]);

  // Fetch any existing form if we're editing (not used)
  useQuery({
    queryKey: ['/api/programs'],
  });

  const createFormMutation = useMutation({
    mutationFn: (formData: InsertApplicationForm) => {
      console.log('💙 Création du formulaire avec les données:', formData);

      if (!programId) {
        throw new Error('Aucun programme sélectionné');
      }

      // Utiliser notre solution ultra-directe
      const savedForm = saveFormDirect(formData, programId);

      if (!savedForm) {
        throw new Error('Erreur lors de la sauvegarde du formulaire');
      }

      console.log('💙 Formulaire sauvegardé avec succès:', savedForm);

      // Simuler une réponse API réussie
      return Promise.resolve({ success: true, formId: savedForm.id });
    },
    onSuccess: (data) => {
      console.log('💙 Formulaire créé avec succès:', data);

      toast({
        title: "Formulaire créé",
        description: "Le formulaire de candidature a été créé avec succès.",
      });

      // Attendre un peu pour s'assurer que les données sont bien sauvegardées
      setTimeout(() => {
        // Rediriger vers la page des candidatures
        setLocation("/applications");
      }, 2000);
    },
    onError: (error) => {
      console.error('💙 Erreur lors de la création du formulaire:', error);

      toast({
        title: "Erreur lors de la création du formulaire",
        description: "Impossible de créer le formulaire de candidature. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  });

  const handleSaveForm = (questions: FormQuestion[]) => {
    if (!programId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un programme avant de créer un formulaire.",
        variant: "destructive",
      });
      return;
    }

    const formTitle = selectedProgram ?
      `Formulaire de candidature - ${selectedProgram.name}` :
      "Formulaire de candidature";

    const formDescription = selectedProgram ?
      `Formulaire pour postuler au programme ${selectedProgram.name}` :
      "Formulaire de candidature au programme";

    const formContent = {
      questions,
      settings: {
        title: formTitle,
        description: formDescription,
        submitButtonText: "Soumettre la candidature",
        showProgressBar: true,
        allowSaveDraft: true,
        confirmationMessage: "Merci pour votre candidature ! Nous l'examinerons et reviendrons vers vous bientôt.",
        notificationEmail: ""
      }
    };

    console.log(`Création d'un formulaire pour le programme ID: ${programId}`);

    createFormMutation.mutate({
      name: formTitle,
      description: formDescription,
      programId,
      formSchema: JSON.stringify(formContent),
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/applications")}
            className="mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Forms
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Create Application Form</h1>
          <p className="text-muted-foreground">
            Design an application form for startups to apply to your program
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {!selectedProgram ? (
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium mb-2">Aucun programme sélectionné</h3>
              <p className="text-gray-500 mb-4">
                Veuillez sélectionner un programme avant de créer un formulaire de candidature.
              </p>
              <Button onClick={() => setLocation("/programs")}>
                Voir les programmes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <p className="text-sm font-medium">Programme sélectionné: {selectedProgram.name}</p>
                </div>
              </CardContent>
            </Card>
            <SimpleApplicationFormBuilder
              programId={programId as number}
              onSave={handleSaveForm}
            />
          </>
        )}
      </div>

      {createFormMutation.isPending && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Saving form...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateApplicationForm;




