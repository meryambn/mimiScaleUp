import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProgramContext } from './ProgramContext';
import { FileText, Video, ExternalLink } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

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
}

export interface ExternalResource {
  id: string;
  title: string;
  url: string;
  programId?: string;
}

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
  createResource: (resource: Omit<Resource, 'id'>) => string;
  createExternalResource: (resource: Omit<ExternalResource, 'id'>) => string;
  addResources: (resources: Omit<Resource, 'id'>[]) => string[];
}

// Create context
const ResourcesContext = createContext<ResourcesContextType | undefined>(undefined);

// Provider component
export const ResourcesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedProgramId } = useProgramContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [externalResources, setExternalResources] = useState<ExternalResource[]>([]);

  // Mock resources data
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
    },
    {
      id: "3",
      title: "How to Secure Seed Funding",
      description: "Video tutorial on preparing for and securing seed funding",
      type: "video",
      url: "#",
      createdAt: "2023-05-20",
      programId: "1",
      category: "Training"
    },
    {
      id: "4",
      title: "Financial Projection Spreadsheet",
      description: "Excel template for creating 3-year financial projections",
      type: "spreadsheet",
      url: "#",
      createdAt: "2023-05-25",
      programId: "1",
      category: "Templates"
    },
    {
      id: "5",
      title: "Legal Checklist for Startups",
      description: "Essential legal considerations for early-stage startups",
      type: "document",
      url: "#",
      createdAt: "2023-06-01",
      programId: "1",
      category: "Guidelines"
    }
  ];

  // Mock external resources data
  const initialExternalResources: ExternalResource[] = [
    { id: "e1", title: "YCombinator Startup School", url: "https://www.startupschool.org/", programId: "1" },
    { id: "e2", title: "Startup Playbook", url: "https://playbook.samaltman.com/", programId: "1" },
    { id: "e3", title: "500 Startups Resources", url: "https://500.co/startups", programId: "1" },
    { id: "e4", title: "Techstars Entrepreneur's Toolkit", url: "https://www.techstars.com/entrepreneurs", programId: "1" }
  ];

  // Initialize resources with initial data
  useEffect(() => {
    setResources(initialResources);
    setExternalResources(initialExternalResources);
  }, []);

  // Filter resources based on selected filters, search query, and program
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(resource.type);
    const matchesProgram = !selectedProgramId || resource.programId === selectedProgramId;
    return matchesSearch && matchesType && matchesProgram;
  });

  // Filter external resources
  const filteredExternalResources = externalResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgram = !selectedProgramId || !resource.programId || resource.programId === selectedProgramId;
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
  const createResource = (resource: Omit<Resource, 'id'>): string => {
    const newResourceId = uuidv4();
    const newResource: Resource = {
      ...resource,
      id: newResourceId
    };
    
    setResources(prevResources => [...prevResources, newResource]);
    return newResourceId;
  };
  
  // Function to create a new external resource
  const createExternalResource = (resource: Omit<ExternalResource, 'id'>): string => {
    const newResourceId = uuidv4();
    const newResource: ExternalResource = {
      ...resource,
      id: newResourceId
    };
    
    setExternalResources(prevResources => [...prevResources, newResource]);
    return newResourceId;
  };
  
  // Function to add multiple resources at once
  const addResources = (resourcesData: Omit<Resource, 'id'>[]): string[] => {
    const newResourceIds: string[] = [];
    
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
    addResources
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