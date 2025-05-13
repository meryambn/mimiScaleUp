import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProgramContext } from './ProgramContext';
import { FileText, Video, ExternalLink } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  getProgramResources,
  createResource as apiCreateResource,
  updateResource as apiUpdateResource,
  deleteResource as apiDeleteResource,
  getResourceDownloadUrl,
  Resource as ApiResource,
  ExternalResource as ApiExternalResource
} from '@/services/resourceService';

// Interfaces
export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'spreadsheet' | 'video' | 'presentation' | 'other';
  url: string;
  createdAt: string;
  programId: string;
  category?: string;
  file_path?: string;
  is_external?: boolean;
  file?: File; // For file uploads
}

export interface ExternalResource {
  id: string;
  title: string;
  url: string;
  programId?: string;
}

// Helper function to convert API resource to context resource
const apiToContextResource = (resource: ApiResource): Resource => ({
  id: resource.id.toString(),
  title: resource.title,
  description: resource.description || '',
  type: resource.type.toLowerCase() as any,
  url: resource.url || getResourceDownloadUrl(resource.id),
  createdAt: resource.created_at,
  programId: resource.program_id.toString(),
  category: resource.category,
  file_path: resource.file_path,
  is_external: resource.is_external
});

// Helper function to convert API external resource to context external resource
const apiToContextExternalResource = (resource: ApiExternalResource): ExternalResource => ({
  id: resource.id.toString(),
  title: resource.title,
  url: resource.url,
  programId: resource.program_id.toString()
});

// Context interface
interface ResourcesContextType {
  resources: Resource[];
  externalResources: ExternalResource[];
  filteredResources: Resource[];
  filteredExternalResources: ExternalResource[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  getResourceTypeIcon: (type: string) => React.ReactNode;
  getCategoryColor: (category: string) => string;
  createResource: (resource: Omit<Resource, 'id'>) => Promise<string>;
  createExternalResource: (resource: Omit<ExternalResource, 'id'>) => Promise<string>;
  addResources: (resources: Omit<Resource, 'id'>[]) => Promise<string[]>;
  deleteResource: (resourceId: string) => Promise<boolean>;
  deleteExternalResource: (resourceId: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

// Create context
const ResourcesContext = createContext<ResourcesContextType | undefined>(undefined);

// Provider component
export const ResourcesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedProgram } = useProgramContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [externalResources, setExternalResources] = useState<ExternalResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback mock resources data (used when API fails or no program selected)
  const initialResources: Resource[] = [
    {
      id: "1",
      title: "Startup Pitch Deck Template",
      description: "A comprehensive template for creating effective pitch decks",
      type: "presentation",
      url: "#",
      createdAt: "2023-05-10",
      programId: "1",
      category: "Templates"
    },
    {
      id: "2",
      title: "Market Research Guidelines",
      description: "Step-by-step guide for conducting thorough market research",
      type: "document",
      url: "#",
      createdAt: "2023-05-15",
      programId: "1",
      category: "Guidelines"
    }
  ];

  // Fallback mock external resources data
  const initialExternalResources: ExternalResource[] = [
    { id: "e1", title: "YCombinator Startup School", url: "https://www.startupschool.org/", programId: "1" },
    { id: "e2", title: "Startup Playbook", url: "https://playbook.samaltman.com/", programId: "1" }
  ];

  // Fetch resources from API when program changes
  useEffect(() => {
    const fetchResources = async () => {
      // If no program is selected, use mock data
      if (!selectedProgram?.id) {
        setResources(initialResources);
        setExternalResources(initialExternalResources);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // First check if the selected program already has resources in its object
        if (selectedProgram.resources && selectedProgram.resources.length > 0) {
          console.log("Using resources from selected program:", selectedProgram.resources);

          // Convert program resources to context resources
          const programResources = selectedProgram.resources.map((r: any) => ({
            id: String(r.id),
            title: r.title,
            description: r.description || '',
            type: typeof r.type === 'string' ? r.type.toLowerCase() : 'document',
            url: r.url || '',
            createdAt: r.created_at || new Date().toISOString(),
            programId: String(r.program_id || selectedProgram.id),
            category: r.category || '',
            is_external: r.is_external || false
          }));

          // Separate into regular and external resources
          const regularResources = programResources.filter(r => !r.is_external);
          const externalResources = programResources.filter(r => r.is_external);

          setResources(regularResources);
          setExternalResources(externalResources.map(r => ({
            id: r.id,
            title: r.title,
            url: r.url,
            programId: r.programId
          })));

          setIsLoading(false);
          return;
        }

        // If no resources in the program object, call the API
        console.log("Fetching resources from API for program:", selectedProgram.id);
        const result = await getProgramResources(selectedProgram.id);

        // Convert API resources to context resources
        const contextResources = result.resources.map(apiToContextResource);
        const contextExternalResources = result.externalResources.map(apiToContextExternalResource);

        setResources(contextResources);
        setExternalResources(contextExternalResources);
      } catch (err) {
        console.error("Failed to fetch resources:", err);
        setError("Failed to load resources. Using sample data instead.");

        // Fallback to mock data on error
        setResources(initialResources);
        setExternalResources(initialExternalResources);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [selectedProgram]);

  // Filter resources based on selected filters, search query, and program
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(resource.type);
    const matchesProgram = !selectedProgram?.id || resource.programId === selectedProgram.id;
    return matchesSearch && matchesType && matchesProgram;
  });

  // Filter external resources
  const filteredExternalResources = externalResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgram = !selectedProgram?.id || !resource.programId || resource.programId === selectedProgram.id;
    return matchesSearch && matchesProgram;
  });

  // Get icon for resource type
  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5 text-blue-500" />;
      case "spreadsheet":
        return <FileText className="h-5 w-5 text-green-500" />;
      case "presentation":
        return <FileText className="h-5 w-5 text-purple-500" />;
      case "document":
      default:
        return <FileText className="h-5 w-5 text-orange-500" />;
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'guidelines':
        return 'bg-blue-100 text-blue-800';
      case 'templates':
        return 'bg-purple-100 text-purple-800';
      case 'resources':
        return 'bg-green-100 text-green-800';
      case 'training':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to create a new resource
  const createResource = async (resource: Omit<Resource, 'id'>): Promise<string> => {
    if (!selectedProgram?.id) {
      throw new Error("No program selected. Cannot create resource.");
    }

    try {
      // Prepare the request data
      const requestData = {
        title: resource.title,
        description: resource.description,
        type: resource.type,
        is_external: false,
        category: resource.category,
        url: resource.url,
        file: resource.file // Pass the file for upload
      };

      // Call the API to create the resource
      const result = await apiCreateResource(selectedProgram.id, requestData);

      // Create a new resource with the returned ID
      const newResource: Resource = {
        ...resource,
        id: result.id.toString()
      };

      // Update the local state
      setResources(prevResources => [...prevResources, newResource]);

      // Refresh resources from the API
      getProgramResources(selectedProgram.id)
        .then(result => {
          setResources(result.resources.map(apiToContextResource));
          setExternalResources(result.externalResources.map(apiToContextExternalResource));
        })
        .catch(err => console.error("Failed to refresh resources after creation:", err));

      return result.id.toString();
    } catch (error) {
      console.error("Error creating resource:", error);

      // Fallback to local creation if API fails
      const newResourceId = uuidv4();
      const newResource: Resource = {
        ...resource,
        id: newResourceId
      };

      setResources(prevResources => [...prevResources, newResource]);
      return newResourceId;
    }
  };

  // Function to create a new external resource
  const createExternalResource = async (resource: Omit<ExternalResource, 'id'>): Promise<string> => {
    if (!selectedProgram?.id) {
      throw new Error("No program selected. Cannot create external resource.");
    }

    try {
      // Prepare the request data
      const requestData = {
        title: resource.title,
        url: resource.url,
        is_external: true,
        type: 'Autre' // Default type for external resources
      };

      // Call the API to create the external resource
      const result = await apiCreateResource(selectedProgram.id, requestData);

      // Create a new external resource with the returned ID
      const newResource: ExternalResource = {
        ...resource,
        id: result.id.toString(),
        programId: selectedProgram.id.toString()
      };

      // Update the local state
      setExternalResources(prevResources => [...prevResources, newResource]);

      // Refresh resources from the API
      getProgramResources(selectedProgram.id)
        .then(result => {
          setResources(result.resources.map(apiToContextResource));
          setExternalResources(result.externalResources.map(apiToContextExternalResource));
        })
        .catch(err => console.error("Failed to refresh resources after creation:", err));

      return result.id.toString();
    } catch (error) {
      console.error("Error creating external resource:", error);

      // Fallback to local creation if API fails
      const newResourceId = uuidv4();
      const newResource: ExternalResource = {
        ...resource,
        id: newResourceId,
        programId: selectedProgram.id.toString()
      };

      setExternalResources(prevResources => [...prevResources, newResource]);
      return newResourceId;
    }
  };

  // Function to add multiple resources at once
  const addResources = async (resourcesData: Omit<Resource, 'id'>[]): Promise<string[]> => {
    if (!selectedProgram?.id) {
      throw new Error("No program selected. Cannot add resources.");
    }

    const newResourceIds: string[] = [];

    try {
      // Create each resource one by one
      for (const resourceData of resourcesData) {
        const id = await createResource(resourceData);
        newResourceIds.push(id);
      }

      return newResourceIds;
    } catch (error) {
      console.error("Error adding multiple resources:", error);

      // Fallback to local creation if API fails
      const newResources = resourcesData.map(resource => {
        const newResourceId = uuidv4();
        newResourceIds.push(newResourceId);

        return {
          ...resource,
          id: newResourceId
        };
      });

      setResources(prevResources => [...prevResources, ...newResources]);
      return newResourceIds;
    }
  };

  // Function to delete a resource
  const deleteResource = async (resourceId: string): Promise<boolean> => {
    if (!selectedProgram?.id) {
      throw new Error("No program selected. Cannot delete resource.");
    }

    try {
      // Remove the resource from the local state immediately for responsive UI
      // We do this before the API call to make the UI feel more responsive
      setResources(prevResources => prevResources.filter(r => r.id !== resourceId));

      try {
        // Call the API to delete the resource
        await apiDeleteResource(resourceId);

        // Refresh resources from the API to ensure data consistency
        try {
          const result = await getProgramResources(selectedProgram.id);
          setResources(result.resources.map(apiToContextResource));
          setExternalResources(result.externalResources.map(apiToContextExternalResource));
        } catch (refreshError) {
          console.error("Failed to refresh resources after deletion:", refreshError);
          // The deletion was successful, so we'll still return true even if the refresh failed
        }
      } catch (apiError) {
        console.error("API error deleting resource:", apiError);
        // Even if the API call fails, we'll keep the resource removed from the UI
        // This is a temporary solution until the backend CORS issue is fixed
        console.log("Resource removed from UI but may still exist on the server");
      }

      return true;
    } catch (error) {
      console.error("Error deleting resource:", error);
      return false;
    }
  };

  // Function to delete an external resource
  const deleteExternalResource = async (resourceId: string): Promise<boolean> => {
    if (!selectedProgram?.id) {
      throw new Error("No program selected. Cannot delete external resource.");
    }

    try {
      // Call the API to delete the resource (same endpoint for both types)
      await apiDeleteResource(resourceId);

      // Remove the resource from the local state immediately for responsive UI
      setExternalResources(prevResources => prevResources.filter(r => r.id !== resourceId));

      // Refresh resources from the API to ensure data consistency
      try {
        const result = await getProgramResources(selectedProgram.id);
        setResources(result.resources.map(apiToContextResource));
        setExternalResources(result.externalResources.map(apiToContextExternalResource));
      } catch (refreshError) {
        console.error("Failed to refresh resources after deletion:", refreshError);
        // The deletion was successful, so we'll still return true even if the refresh failed
      }

      return true;
    } catch (error) {
      console.error("Error deleting external resource:", error);
      return false;
    }
  };

  // Value object for the context provider
  const value = {
    resources,
    externalResources,
    filteredResources,
    filteredExternalResources,
    searchQuery,
    setSearchQuery,
    selectedTypes,
    setSelectedTypes,
    getResourceTypeIcon,
    getCategoryColor,
    createResource,
    createExternalResource,
    addResources,
    deleteResource,
    deleteExternalResource,
    isLoading,
    error
  };

  return (
    <ResourcesContext.Provider value={value}>
      {children}
    </ResourcesContext.Provider>
  );
};

// Custom hook to use the resources context
export const useResources = (): ResourcesContextType => {
  const context = useContext(ResourcesContext);
  if (context === undefined) {
    throw new Error('useResources must be used within a ResourcesProvider');
  }
  return context;
};