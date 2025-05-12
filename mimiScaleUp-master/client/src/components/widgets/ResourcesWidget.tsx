import React, { useEffect, useState } from 'react';
import { PlusCircle, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useResources } from '@/context/ResourcesContext';
import { useProgramContext } from '@/context/ProgramContext';
import { getProgramResources, Resource as ApiResource } from '@/services/resourceService';

interface WidgetResource {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  createdAt: string;
  category?: string;
  is_external?: boolean;
}

const ResourcesWidget: React.FC = () => {
  const {
    getResourceTypeIcon,
    getCategoryColor
  } = useResources();

  const { selectedProgram } = useProgramContext();
  const [isLoading, setIsLoading] = useState(true);
  const [widgetResources, setWidgetResources] = useState<WidgetResource[]>([]);

  // Fetch resources directly from the API for the widget
  useEffect(() => {
    const fetchResources = async () => {
      if (!selectedProgram?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Call the API to get resources for the selected program
        const result = await getProgramResources(selectedProgram.id);

        // Convert API resources to widget resources
        const formattedResources: WidgetResource[] = [
          ...result.resources.map((r: ApiResource) => ({
            id: String(r.id),
            title: r.title,
            description: r.description || '',
            type: r.type.toLowerCase(),
            url: r.url || `/api/resources/download/${r.id}`,
            createdAt: r.created_at,
            category: r.category,
            is_external: r.is_external
          })),
          ...result.externalResources.map((r: any) => ({
            id: `ext-${r.id}`,
            title: r.title,
            description: '',
            type: 'link',
            url: r.url,
            createdAt: new Date().toISOString(),
            is_external: true
          }))
        ];

        setWidgetResources(formattedResources);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [selectedProgram]);

  // Get only the first 4 resources for display
  const displayResources = widgetResources.slice(0, 4);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Ressources</h3>
        <PlusCircle className="h-5 w-5 text-teal-500" />
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayResources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedProgram ? (
                <>
                  <p>Aucune ressource trouvée</p>
                  <p className="text-sm mt-2">Ajoutez des ressources dans la section Ressources</p>
                </>
              ) : (
                <p>Veuillez sélectionner un programme</p>
              )}
            </div>
          ) : (
            displayResources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getResourceTypeIcon(resource.type)}
                    <div>
                      <h4 className="text-sm font-medium">{resource.title}</h4>
                      {resource.category && (
                        <Badge className={getCategoryColor(resource.category)}>
                          {resource.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Ajouté le {new Date(resource.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ResourcesWidget;