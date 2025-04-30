import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Video, Download, ExternalLink, Upload, X } from "lucide-react";
import { useProgramContext } from "@/context/ProgramContext";
import { useResources, Resource as ContextResource, ExternalResource as ContextExternalResource } from "@/context/ResourcesContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";

// Mock resources data
const resourcesData = [
  {
    id: "1",
    title: "Startup Pitch Deck Template",
    description: "A comprehensive template for creating effective pitch decks",
    type: "document",
    url: "#",
    createdAt: "2023-05-10"
  },
  {
    id: "2",
    title: "Market Research Guidelines",
    description: "Step-by-step guide for conducting thorough market research",
    type: "document",
    url: "#",
    createdAt: "2023-05-15"
  },
  {
    id: "3",
    title: "How to Secure Seed Funding",
    description: "Video tutorial on preparing for and securing seed funding",
    type: "video",
    url: "#",
    createdAt: "2023-05-20"
  },
  {
    id: "4",
    title: "Financial Projection Spreadsheet",
    description: "Excel template for creating 3-year financial projections",
    type: "spreadsheet",
    url: "#",
    createdAt: "2023-05-25"
  },
  {
    id: "5",
    title: "Legal Checklist for Startups",
    description: "Essential legal considerations for early-stage startups",
    type: "document",
    url: "#",
    createdAt: "2023-06-01"
  }
];

// Mock external resources data
const externalResourcesData = [
  { id: "e1", title: "YCombinator Startup School", url: "https://www.startupschool.org/" },
  { id: "e2", title: "Startup Playbook", url: "https://playbook.samaltman.com/" },
  { id: "e3", title: "500 Startups Resources", url: "https://500.co/startups" },
  { id: "e4", title: "Techstars Entrepreneur's Toolkit", url: "https://www.techstars.com/entrepreneurs" }
];

// Use local interfaces for the component, but use the context types for the API
interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  createdAt: string;
}

interface ExternalResource {
  id: string;
  title: string;
  url: string;
}

const ResourceTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "video":
      return <Video className="h-5 w-5 text-blue-500" />;
    case "spreadsheet":
      return <FileText className="h-5 w-5 text-green-500" />;
    case "document":
    default:
      return <FileText className="h-5 w-5 text-orange-500" />;
  }
};

const ResourceCard = ({ resource, onDelete }: { resource: Resource; onDelete: (id: string) => Promise<void> }) => {
  const { getResourceTypeIcon } = useResources();
  const [isDeleting, setIsDeleting] = useState(false);

  // Format the date
  const formattedDate = new Date(resource.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${resource.title}" ?`)) {
      setIsDeleting(true);
      try {
        await onDelete(resource.id);
      } catch (error) {
        console.error("Error deleting resource:", error);
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getResourceTypeIcon(resource.type)}
            <CardTitle className="text-lg">{resource.title}</CardTitle>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 transition-colors"
            title="Supprimer cette ressource"
          >
            {isDeleting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        </div>
        <CardDescription>{resource.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Ajouté le {formattedDate}
          </div>
          <a
            href={resource.url}
            target={resource.is_external ? "_blank" : "_self"}
            rel="noopener noreferrer"
            download={!resource.is_external}
            style={{
              backgroundColor: 'white',
              color: '#0c4c80',
              border: '1px solid #e5e7eb',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.875rem',
              textDecoration: 'none'
            }}
          >
            <Download className="h-4 w-4" />
            {resource.is_external ? 'Visiter' : 'Télécharger'}
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

const ExternalResourceItem = ({
  resource,
  onDelete
}: {
  resource: ExternalResource;
  onDelete: (id: string) => Promise<void>
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${resource.title}" ?`)) {
      setIsDeleting(true);
      try {
        await onDelete(resource.id);
      } catch (error) {
        console.error("Error deleting external resource:", error);
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-md mb-2">
      <div className="font-medium">{resource.title}</div>
      <div className="flex items-center gap-2">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: 'transparent',
            color: '#0c4c80',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.875rem',
            textDecoration: 'none'
          }}
        >
          <ExternalLink className="h-4 w-4" />
          Visiter
        </a>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-500 hover:text-red-700 transition-colors p-1"
          title="Supprimer cette ressource"
        >
          {isDeleting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

// File upload component
const FileUpload = ({ onFileSelect }: { onFileSelect: (file: File | null) => void }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    onFileSelect(file);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    onFileSelect(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center w-full">
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-3 pb-3">
            <Upload className="w-6 h-6 mb-1 text-gray-500" />
            <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">Cliquez pour télécharger</span></p>
            <p className="text-xs text-gray-500">PDF, DOC, XLS, PPT, MP4 (MAX 10MB)</p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mov"
          />
        </label>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between p-2 mt-2 bg-blue-50 border border-blue-100 rounded-md">
          <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

const AddResourceDialog = ({
  open,
  onOpenChange,
  onAddResource,
  onAddExternalResource
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddResource: (resource: any) => void;
  onAddExternalResource: (resource: ExternalResource) => void;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('document');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExternalLink, setIsExternalLink] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isExternalLink) {
        // Add as external resource
        const newExternalResource: ExternalResource = {
          id: uuidv4(), // This ID will be replaced by the backend
          title,
          url
        };
        await onAddExternalResource(newExternalResource);
      } else {
        // Add as program resource
        const newResource = {
          title,
          description,
          type: type as 'document' | 'spreadsheet' | 'video' | 'presentation' | 'other',
          url: '#', // Will be set by the backend for file resources
          createdAt: new Date().toISOString(),
          file: file, // Pass the actual file object for upload
          is_external: false // Explicitly mark as non-external
        };
        await onAddResource(newResource);
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting resource:", error);
      // Could show an error message here
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('document');
    setUrl('');
    setFile(null);
    setIsExternalLink(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-2">
            <DialogTitle>Ajouter une Nouvelle Ressource</DialogTitle>
            <DialogDescription>
              Téléchargez un fichier ou ajoutez un lien vers une ressource externe.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-3">
            <div className="grid gap-1.5">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Modèle de Plan Financier"
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="external-link"
                  checked={isExternalLink}
                  onChange={() => setIsExternalLink(!isExternalLink)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="external-link">Ajouter un lien externe</Label>
              </div>
              <p className="text-xs text-gray-500">
                {isExternalLink
                  ? "Les liens externes apparaîtront dans la section Ressources Externes"
                  : "Les fichiers téléchargés apparaîtront dans la section Matériels du Programme"}
              </p>
            </div>

            {isExternalLink ? (
              <div className="grid gap-1.5">
                <Label htmlFor="url">URL de la Ressource</Label>
                <Input
                  id="url"
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                />
              </div>
            ) : (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brève description de cette ressource"
                    rows={2}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="type">Type de Ressource</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Sélectionner le type de ressource" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="spreadsheet">Tableur</SelectItem>
                        <SelectItem value="video">Vidéo</SelectItem>
                        <SelectItem value="presentation">Présentation</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label>Télécharger un Fichier</Label>
                  <FileUpload onFileSelect={setFile} />
                  <p className="text-xs text-gray-500">Taille maximale du fichier: 10MB</p>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              style={{
                backgroundColor: 'white',
                color: '#0c4c80',
                border: '1px solid #e5e7eb',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isExternalLink ? !url : !file) || !title}
              style={{
                background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: (isSubmitting || (isExternalLink ? !url : !file) || !title) ? 'not-allowed' : 'pointer',
                opacity: (isSubmitting || (isExternalLink ? !url : !file) || !title) ? '0.5' : '1'
              }}
            >
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter la Ressource'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ResourcesPage: React.FC = () => {
  const { selectedProgram } = useProgramContext();
  const {
    resources,
    externalResources,
    filteredResources,
    filteredExternalResources,
    createResource,
    createExternalResource,
    deleteResource,
    deleteExternalResource,
    isLoading,
    error
  } = useResources();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddResource = async (newResource: any) => {
    try {
      // Add programId to the resource
      const resourceWithProgramId: Omit<ContextResource, 'id'> = {
        title: newResource.title,
        description: newResource.description,
        type: newResource.type as 'document' | 'spreadsheet' | 'video' | 'presentation' | 'other',
        url: newResource.url,
        createdAt: newResource.createdAt,
        programId: selectedProgram?.id || '1', // Default to '1' if no program selected
        file: newResource.file // Pass the file object for upload
      };

      // Create the resource (now returns a Promise)
      const resourceId = await createResource(resourceWithProgramId);
      console.log(`Resource created with ID: ${resourceId}`);
    } catch (error) {
      console.error("Failed to create resource:", error);
      // Could show an error toast here
    }
  };

  const handleAddExternalResource = async (newResource: ExternalResource) => {
    try {
      // Convert to context type
      const contextResource: Omit<ContextExternalResource, 'id'> = {
        title: newResource.title,
        url: newResource.url,
        programId: selectedProgram?.id || '1'
      };

      // Create the external resource (now returns a Promise)
      const resourceId = await createExternalResource(contextResource);
      console.log(`External resource created with ID: ${resourceId}`);
    } catch (error) {
      console.error("Failed to create external resource:", error);
      // Could show an error toast here
    }
  };

  // Handle resource deletion
  const handleDeleteResource = async (resourceId: string) => {
    try {
      const success = await deleteResource(resourceId);
      if (success) {
        console.log(`Resource deleted with ID: ${resourceId}`);
      } else {
        console.error(`Failed to delete resource with ID: ${resourceId}`);
      }
    } catch (error) {
      console.error("Error in handleDeleteResource:", error);
    }
  };

  // Handle external resource deletion
  const handleDeleteExternalResource = async (resourceId: string) => {
    try {
      const success = await deleteExternalResource(resourceId);
      if (success) {
        console.log(`External resource deleted with ID: ${resourceId}`);
      } else {
        console.error(`Failed to delete external resource with ID: ${resourceId}`);
      }
    } catch (error) {
      console.error("Error in handleDeleteExternalResource:", error);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Ressources</h1>
            {selectedProgram && (
              <p className="text-gray-500">
                Programme: <span className="font-medium">{selectedProgram.name}</span>
              </p>
            )}
          </div>
          <button onClick={() => setDialogOpen(true)} style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une Ressource
          </button>
        </div>
      </div>

      <AddResourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddResource={handleAddResource}
        onAddExternalResource={handleAddExternalResource}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Chargement...</span>
              </div>
              <p className="mt-2 text-gray-600">Chargement des ressources...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Erreur!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <>
            {/* Program Resources */}
            <div className="mb-8">
              <h2 className="text-xl font-medium mb-4">Matériels du Programme</h2>
              {filteredResources.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-gray-500">
                    Aucun matériel disponible pour ce programme.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onDelete={handleDeleteResource}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* External Resources */}
            <div>
              <h2 className="text-xl font-medium mb-4">Ressources Externes</h2>
              <Card>
                <CardContent className="pt-6">
                  {filteredExternalResources.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      Aucune ressource externe disponible pour ce programme.
                    </div>
                  ) : (
                    filteredExternalResources.map((resource) => (
                      <ExternalResourceItem
                        key={resource.id}
                        resource={resource}
                        onDelete={handleDeleteExternalResource}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;