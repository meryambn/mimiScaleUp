import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ProgramTemplateCard from './ProgramTemplateCard';
import { ProgramTemplate, SavedProgramTemplate } from '@/types/program';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { getSavedProgramTemplates, getLocalProgramTemplates } from '@/utils/programTemplates';

interface ProgramTemplateSelectorProps {
  templates: ProgramTemplate[];
  savedTemplates: SavedProgramTemplate[];
  selectedTemplateId: string | null;
  onTemplateSelect: (template: ProgramTemplate) => void;
  onSavedTemplateSelect: (template: SavedProgramTemplate) => void;
  onCustomProgramCreate: () => void;
}

const ProgramTemplateSelector: React.FC<ProgramTemplateSelectorProps> = ({
  templates,
  savedTemplates: initialSavedTemplates,
  selectedTemplateId,
  onTemplateSelect,
  onSavedTemplateSelect,
  onCustomProgramCreate,
}) => {
  const [savedTemplates, setSavedTemplates] = useState<SavedProgramTemplate[]>(initialSavedTemplates);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("predefined");

  // Load templates from both localStorage and backend when the component mounts
  // or when the user switches to the saved templates tab
  useEffect(() => {
    const loadTemplates = async () => {
      if (activeTab === "saved") {
        setIsLoading(true);
        try {
          // Get templates from both localStorage and backend
          const templates = await getSavedProgramTemplates();
          setSavedTemplates(templates);
        } catch (error) {
          console.error('Error loading templates:', error);
          // Fallback to local templates if API fails
          const localTemplates = getLocalProgramTemplates();
          setSavedTemplates(localTemplates);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadTemplates();
  }, [activeTab]);

  console.log('ProgramTemplateSelector props:', {
    templates,
    savedTemplates,
    selectedTemplateId,
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="predefined" className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="predefined">Modèles prédéfinis</TabsTrigger>
          <TabsTrigger value="saved">Modèles enregistrés {!isLoading && `(${savedTemplates.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="predefined" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <ProgramTemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={() => {
                  console.log('Template card selected:', template.id);
                  onTemplateSelect(template);
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Chargement des modèles...</span>
            </div>
          ) : savedTemplates.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Aucun modèle enregistré</p>
              <p className="text-sm text-gray-400 mt-2">Les modèles que vous enregistrez apparaîtront ici</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedTemplates.map((template) => (
                <ProgramTemplateCard
                  key={template.id}
                  template={{
                    id: template.id,
                    name: template.name,
                    description: template.description,
                    phases: template.programData.phases || [],
                    evaluationCriteria: template.programData.evaluationCriteria || [],
                    formTemplates: [],
                    dashboardWidgets: (template.programData.dashboardWidgets || []).map(widget => ({
                      ...widget,
                      content: null // Ajouter la propriété content requise
                    })),
                    startDate: new Date(template.programData.startDate),
                    endDate: new Date(template.programData.endDate),
                    mentors: template.programData.mentors || [],
                    eligibilityCriteria: template.programData.eligibilityCriteria,
                    createdAt: template.createdAt,
                    isCustom: true,
                    isBackendTemplate: template.isBackendTemplate // Pass through the backend template flag
                  }}
                  isSelected={selectedTemplateId === template.id}
                  onSelect={() => {
                    console.log('Saved template selected:', template.id);
                    onSavedTemplateSelect(template);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-center mt-6">
        <button
          style={{ backgroundColor: '#e43e32', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => {
            console.log('Custom program button clicked');
            onCustomProgramCreate();
          }}
        >
          Créer un programme personnalisé
        </button>
      </div>
    </div>
  );
};

export default ProgramTemplateSelector;