import React from 'react';
import { Button } from '@/components/ui/button';
import ProgramTemplateCard from './ProgramTemplateCard';
import { ProgramTemplate, SavedProgramTemplate } from '@/types/program';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  savedTemplates,
  selectedTemplateId,
  onTemplateSelect,
  onSavedTemplateSelect,
  onCustomProgramCreate,
}) => {
  console.log('ProgramTemplateSelector props:', {
    templates,
    selectedTemplateId,
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="predefined" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="predefined">Modèles prédéfinis</TabsTrigger>
          <TabsTrigger value="saved" disabled={savedTemplates.length === 0}>Modèles enregistrés ({savedTemplates.length})</TabsTrigger>
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
          {savedTemplates.length === 0 ? (
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
                    isCustom: true
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