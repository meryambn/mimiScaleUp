import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { FormQuestion } from '@/components/application/SimpleApplicationFormBuilder';
import ApplicationFormTabs, { FormSettings } from '@/components/application/ApplicationFormTabs';
import { createFormWithQuestions } from '@/services/formService';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

export default function CreateApplicationForm() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/forms/create/:programId');
  const programId = params?.programId;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [programName, setProgramName] = useState('');
  const { toast } = useToast();

  // Default questions
  const defaultQuestions: FormQuestion[] = [
    {
      id: "q1",
      type: "short_text",
      text: "Quel est le nom de votre startup?",
      required: true
    },
    {
      id: "q2",
      type: "long_text",
      text: "Décrivez votre projet en quelques phrases",
      required: true
    }
  ];

  // Default settings
  const defaultSettings: FormSettings = {
    title: `Formulaire de candidature`,
    description: `Formulaire de candidature pour le programme`,
    submitButtonText: "Soumettre la candidature",
    showProgressBar: true,
    allowSaveDraft: true,
    confirmationMessage: "Merci pour votre candidature ! Nous l'examinerons et reviendrons vers vous bientôt.",
    notificationEmail: "",
    applicationFormLink: ""
  };

  const [questions, setQuestions] = useState<FormQuestion[]>(defaultQuestions);
  const [settings, setSettings] = useState<FormSettings>(defaultSettings);

  // Fetch program details
  useEffect(() => {
    if (programId) {
      setIsLoading(true);
      fetch(`http://localhost:8083/api/programmes/${programId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch program details');
          }
          return response.json();
        })
        .then(data => {
          setProgramName(data.nom || 'Programme');
          setSettings({
            ...settings,
            title: `Formulaire de candidature - ${data.nom}`,
            description: `Formulaire de candidature pour le programme ${data.nom}`
          });
        })
        .catch(error => {
          console.error('Error fetching program details:', error);
          toast({
            title: 'Erreur',
            description: 'Impossible de récupérer les détails du programme',
            variant: 'destructive'
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [programId, toast]);

  const handleSaveForm = async (formQuestions: FormQuestion[], formSettings: FormSettings) => {
    if (!programId) {
      toast({
        title: 'Erreur',
        description: 'ID du programme manquant',
        variant: 'destructive'
      });
      return;
    }

    setQuestions(formQuestions);
    setSettings(formSettings);
    setIsSaving(true);

    try {
      // Create form with questions using the backend API
      const formResult = await createFormWithQuestions(
        programId,
        formSettings.title,
        formSettings.description,
        formQuestions,
        formSettings
      );

      console.log('Form created successfully:', formResult);

      toast({
        title: 'Succès',
        description: 'Formulaire de candidature créé avec succès',
      });

      // Redirect to applications page
      setTimeout(() => {
        setLocation(`/applications?programId=${programId}`);
      }, 1500);
    } catch (error) {
      console.error('Error creating form:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création du formulaire',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation(`/applications?programId=${programId}`)}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux candidatures
        </Button>
        <h1 className="text-2xl font-bold">Créer un formulaire de candidature</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Formulaire de candidature pour {programName}</CardTitle>
          <CardDescription>
            Créez un formulaire de candidature pour votre programme. Les candidats utiliseront ce formulaire pour postuler à votre programme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationFormTabs
            programId={Number(programId)}
            defaultQuestions={questions}
            defaultSettings={settings}
            onSave={handleSaveForm}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={() => setLocation(`/applications?programId=${programId}`)}
            variant="outline"
            className="mr-2"
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              const saveButton = document.querySelector('[data-save-form]') as HTMLButtonElement;
              if (saveButton) {
                saveButton.click();
              } else {
                handleSaveForm(questions, settings);
              }
            }}
            disabled={isSaving}
            style={{
              background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
              color: 'white',
              border: 'none'
            }}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer le formulaire
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
