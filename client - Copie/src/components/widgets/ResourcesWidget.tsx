import React from 'react';
import { PlusCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useResources } from '@/context/ResourcesContext';

const ResourcesWidget: React.FC = () => {
  const { 
    filteredResources, 
    getResourceTypeIcon, 
    getCategoryColor 
  } = useResources();
  
  // Get only the first 4 resources for display
  const displayResources = filteredResources.slice(0, 4);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Resources</h3>
        <PlusCircle className="h-5 w-5 text-teal-500" />
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-4">
          {displayResources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No resources found</p>
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
                  Added on {new Date(resource.createdAt).toLocaleDateString()}
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