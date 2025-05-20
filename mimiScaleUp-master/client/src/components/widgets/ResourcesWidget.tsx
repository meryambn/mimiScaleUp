import React, { useEffect, useState } from 'react';
import { PlusCircle, Download, Loader2, FileText, Video, File, ExternalLink } from 'lucide-react';
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

interface ResourcesWidgetProps {
  programId?: number | string;
  resources?: any[];
}

const ResourcesWidget: React.FC<ResourcesWidgetProps> = ({
  programId,
  resources: propResources = []
}) => {
  const {
    getResourceTypeIcon: contextGetResourceTypeIcon,
    getCategoryColor: contextGetCategoryColor
  } = useResources();

  const { selectedProgram } = useProgramContext();
  const [isLoading, setIsLoading] = useState(true);
  const [widgetResources, setWidgetResources] = useState<WidgetResource[]>([]);

  // Define resource type icons if not available from context
  const getResourceTypeIcon = (type: string) => {
    if (contextGetResourceTypeIcon) return contextGetResourceTypeIcon(type);

    // Fallback implementation
    switch (type?.toLowerCase()) {
      case 'document':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'spreadsheet':
        return <File className="h-5 w-5 text-green-500" />;
      case 'presentation':
        return <File className="h-5 w-5 text-orange-500" />;
      case 'link':
        return <ExternalLink className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Define category colors if not available from context
  const getCategoryColor = (category: string) => {
    if (contextGetCategoryColor) return contextGetCategoryColor(category);

    // Fallback implementation
    switch (category.toLowerCase()) {
      case 'documentation':
        return 'bg-blue-100 text-blue-800';
      case 'tutorial':
        return 'bg-green-100 text-green-800';
      case 'template':
        return 'bg-purple-100 text-purple-800';
      case 'guide':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get resources from props, selected program, or fetch from API
  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);

      console.log("ResourcesWidget: fetchResources called with:", {
        propResourcesLength: propResources ? propResources.length : 'null/undefined',
        programId: programId,
        selectedProgramId: selectedProgram?.id
      });

      try {
        // First check if resources were passed as props
        if (propResources && propResources.length > 0) {
          console.log("ResourcesWidget: Using resources from props:", propResources);

          // Convert prop resources to widget resources
          const formattedResources: WidgetResource[] = propResources.map((r: any) => ({
            id: String(r.id || Math.random().toString(36).substring(7)),
            title: r.title || r.nom || 'Ressource sans titre',
            description: r.description || '',
            type: typeof r.type === 'string' ? r.type.toLowerCase() : 'document',
            url: r.url || `/api/resources/download/${r.id}`,
            createdAt: r.created_at || r.createdAt || new Date().toISOString(),
            category: r.category || '',
            is_external: r.is_external || false
          }));

          console.log("ResourcesWidget: Formatted resources from props:", formattedResources);
          setWidgetResources(formattedResources);
          setIsLoading(false);
          return;
        } else {
          console.log("ResourcesWidget: No resources in props");
        }

        // Next check if the selected program already has resources in its object
        if (selectedProgram?.resources && selectedProgram.resources.length > 0) {
          console.log("ResourcesWidget: Using resources from selected program:", selectedProgram.resources);

          // Convert program resources to widget resources
          const formattedResources: WidgetResource[] = selectedProgram.resources.map((r: any) => ({
            id: String(r.id),
            title: r.title || r.nom || 'Ressource sans titre',
            description: r.description || '',
            type: typeof r.type === 'string' ? r.type.toLowerCase() : 'document',
            url: r.url || `/api/resources/download/${r.id}`,
            createdAt: r.created_at || r.createdAt || new Date().toISOString(),
            category: r.category || '',
            is_external: r.is_external || false
          }));

          setWidgetResources(formattedResources);
          setIsLoading(false);
          return;
        }

        // If no resources in props or program object, call the API
        const effectiveProgramId = programId || (selectedProgram?.id);

        if (!effectiveProgramId) {
          console.log("ResourcesWidget: No program ID available, cannot fetch resources");
          setWidgetResources([]);
          setIsLoading(false);
          return;
        }

        console.log("ResourcesWidget: Fetching resources from API for program:", effectiveProgramId);
        const result = await getProgramResources(effectiveProgramId);
        console.log("ResourcesWidget: API returned resources:", result);

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
        setWidgetResources([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [propResources, selectedProgram, programId]);

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