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

const ResourceCard = ({ resource }: { resource: Resource }) => {
  const { getResourceTypeIcon } = useResources();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getResourceTypeIcon(resource.type)}
            <CardTitle className="text-lg">{resource.title}</CardTitle>
          </div>
        </div>
        <CardDescription>{resource.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Added on {new Date(resource.createdAt).toLocaleDateString()}
          </div>
          <button
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
              fontSize: '0.875rem'
            }}
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

const ExternalResourceItem = ({ title, url }: { title: string; url: string }) => {
  return (
    <div className="flex items-center justify-between p-3 border rounded-md mb-2">
      <div className="font-medium">{title}</div>
      <a
        href={url}
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
        Visit
      </a>
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
            <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      if (isExternalLink) {
        // Add as external resource
        const newExternalResource: ExternalResource = {
          id: uuidv4(),
          title,
          url
        };
        onAddExternalResource(newExternalResource);
      } else {
        // Add as program resource
        const newResource = {
          title,
          description,
          type: type as 'document' | 'spreadsheet' | 'video' | 'presentation' | 'other',
          url: file ? URL.createObjectURL(file) : '#',
          createdAt: new Date().toISOString(),
          programId: '1' // Default value, will be overridden
        };
        onAddResource(newResource);
      }

      resetForm();
      setIsSubmitting(false);
      onOpenChange(false);
    }, 1000);
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
            <DialogTitle>Add New Resource</DialogTitle>
            <DialogDescription>
              Upload a file or add a link to an external resource.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-3">
            <div className="grid gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Financial Model Template"
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
                <Label htmlFor="external-link">Add external link</Label>
              </div>
              <p className="text-xs text-gray-500">
                {isExternalLink
                  ? "External links will appear in the External Resources section"
                  : "File uploads will appear in the Program Materials section"}
              </p>
            </div>

            {isExternalLink ? (
              <div className="grid gap-1.5">
                <Label htmlFor="url">Resource URL</Label>
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
                    placeholder="Brief description of this resource"
                    rows={2}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="type">Resource Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select resource type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="presentation">Presentation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label>Upload File</Label>
                  <FileUpload onFileSelect={setFile} />
                  <p className="text-xs text-gray-500">Max file size: 10MB</p>
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
              Cancel
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
              {isSubmitting ? 'Adding...' : 'Add Resource'}
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
    createExternalResource
  } = useResources();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddResource = (newResource: any) => {
    // Add programId to the resource
    const resourceWithProgramId: Omit<ContextResource, 'id'> = {
      title: newResource.title,
      description: newResource.description,
      type: newResource.type as 'document' | 'spreadsheet' | 'video' | 'presentation' | 'other',
      url: newResource.url,
      createdAt: newResource.createdAt,
      programId: selectedProgram?.id || '1' // Default to '1' if no program selected
    };
    createResource(resourceWithProgramId);
  };

  const handleAddExternalResource = (newResource: ExternalResource) => {
    // Convert to context type
    const contextResource: Omit<ContextExternalResource, 'id'> = {
      title: newResource.title,
      url: newResource.url,
      programId: selectedProgram?.id || '1'
    };
    createExternalResource(contextResource);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Resources</h1>
            {selectedProgram && (
              <p className="text-gray-500">
                Program: <span className="font-medium">{selectedProgram.name}</span>
              </p>
            )}
          </div>
          <button onClick={() => setDialogOpen(true)} style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
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
        {/* Program Resources */}
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Program Materials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>

        {/* External Resources */}
        <div>
          <h2 className="text-xl font-medium mb-4">External Resources</h2>
          <Card>
            <CardContent className="pt-6">
              {filteredExternalResources.map((resource) => (
                <ExternalResourceItem
                  key={resource.id}
                  title={resource.title}
                  url={resource.url}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;