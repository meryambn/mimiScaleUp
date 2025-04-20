import * as React from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FormQuestion } from "./ApplicationFormBuilder";
import SimpleApplicationFormBuilder from "./SimpleApplicationFormBuilder";
import {
  PlusCircle,
  Check,
  Settings,
  Eye,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface FormSettings {
  title: string;
  description: string;
  submitButtonText: string;
  showProgressBar: boolean;
  allowSaveDraft: boolean;
  confirmationMessage: string;
  notificationEmail: string;
  applicationFormLink: string;
}

interface ApplicationFormTabsProps {
  defaultQuestions?: FormQuestion[];
  defaultSettings?: FormSettings;
  onSave: (questions: FormQuestion[], settings: FormSettings) => void;
  programId: number;
}

const ApplicationFormTabs: React.FC<ApplicationFormTabsProps> = ({
  defaultQuestions = [],
  defaultSettings = {
    title: "Formulaire de candidature",
    description: "Veuillez remplir ce formulaire pour postuler à notre programme.",
    submitButtonText: "Soumettre la candidature",
    showProgressBar: false,
    allowSaveDraft: false,
    confirmationMessage: "Merci pour votre candidature ! Nous l'examinerons et reviendrons vers vous bientôt.",
    notificationEmail: "",
    applicationFormLink: ""
  },
  onSave,
  programId
}) => {
  const [activeTab, setActiveTab] = useState<string>("questions");
  const [questions, setQuestions] = useState<FormQuestion[]>(defaultQuestions);
  const [settings, setSettings] = useState<FormSettings>(defaultSettings);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const { toast } = useToast();

  const handleQuestionsChange = (newQuestions: FormQuestion[]) => {
    setQuestions(newQuestions);
  };

  const handleSettingsChange = (field: keyof FormSettings, value: string | boolean) => {
    setSettings({
      ...settings,
      [field]: value
    });
  };

  const handleFormSave = () => {
    onSave(questions, settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="questions" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="questions" className="flex items-center">
                <PlusCircle className="h-4 w-4 mr-2" />
                Questions
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres du formulaire
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </TabsTrigger>
            </TabsList>

            <Button onClick={handleFormSave} className="ml-auto">
              <Check className="h-4 w-4 mr-2" />
              Enregistrer le formulaire
            </Button>
          </div>

          <TabsContent value="questions" className="space-y-6">
            <SimpleApplicationFormBuilder
              programId={1}
              defaultQuestions={questions}
              onSave={handleQuestionsChange}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border p-6 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="form-title">Titre du formulaire</Label>
                <Input
                  id="form-title"
                  value={settings.title}
                  onChange={(e) => handleSettingsChange("title", e.target.value)}
                  placeholder="Formulaire de candidature"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="application-form-link">URL du formulaire de candidature</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                  <Input
                    id="application-form-link"
                    value={`${window.location.origin}/apply/${programId}`}
                    readOnly
                    className="bg-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/apply/${programId}`);
                      toast({
                        title: "Link copied!",
                        description: "Application form link has been copied to clipboard.",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Partagez ce lien avec les équipes pour leur permettre de postuler à votre programme</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="form-description">Description du formulaire</Label>
                <Textarea
                  id="form-description"
                  rows={3}
                  value={settings.description}
                  onChange={(e) => handleSettingsChange("description", e.target.value)}
                  placeholder="Veuillez remplir ce formulaire pour postuler à notre programme."
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="form-confirmation">Message de confirmation</Label>
                <Textarea
                  id="form-confirmation"
                  rows={3}
                  value={settings.confirmationMessage}
                  onChange={(e) => handleSettingsChange("confirmationMessage", e.target.value)}
                  placeholder="Merci pour votre candidature ! Nous l'examinerons et reviendrons vers vous bientôt."
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">{settings.title}</h3>
                <p className="text-gray-600">{settings.description}</p>
              </div>

              {questions.length > 0 ? (
                <div className="space-y-8">
                  {questions.map((question, idx) => (
                    <div key={question.id} className="space-y-3">
                      <h4 className="text-md font-medium text-gray-800">
                        {idx + 1}. {question.text} {question.required && <span className="text-red-500">*</span>}
                      </h4>
                      {question.description && (
                        <p className="text-sm text-gray-500">{question.description}</p>
                      )}

                      {question.type === "short_text" && (
                        <Input disabled placeholder="Réponse courte" />
                      )}

                      {question.type === "long_text" && (
                        <Textarea disabled placeholder="Réponse longue" rows={3} />
                      )}

                      {question.type === "single_choice" && question.options && (
                        <div className="space-y-2">
                          {question.options.map(option => (
                            <div key={option.id} className="flex items-center">
                              <input
                                type="radio"
                                id={`option-${option.id}`}
                                name={`question-${question.id}`}
                                disabled
                                className="mr-2"
                              />
                              <Label htmlFor={`option-${option.id}`}>{option.text}</Label>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === "multiple_choice" && question.options && (
                        <div className="space-y-2">
                          {question.options.map(option => (
                            <div key={option.id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`option-${option.id}`}
                                disabled
                                className="mr-2"
                              />
                              <Label htmlFor={`option-${option.id}`}>{option.text}</Label>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === "dropdown" && question.options && (
                        <select className="w-full p-2 border rounded-md" disabled>
                          <option value="">Sélectionnez une option</option>
                          {question.options.map(option => (
                            <option key={option.id} value={option.id}>{option.text}</option>
                          ))}
                        </select>
                      )}

                      {question.type === "file_upload" && (
                        <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                          <p className="text-gray-500">Téléchargement de fichier (Désactivé dans l'aperçu)</p>
                        </div>
                      )}

                      {question.type === "rating" && (
                        <div className="flex space-x-2">
                          {Array.from({ length: (question.maxRating || 5) - (question.minRating || 1) + 1 }).map((_, i) => (
                            <button
                              key={i}
                              className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"
                              disabled
                            >
                              {(question.minRating || 1) + i}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune question ajoutée pour l'instant</p>
                  <p className="text-sm mt-2">Allez dans l'onglet Questions pour ajouter des questions au formulaire</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button disabled>Soumettre la candidature</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApplicationFormTabs;