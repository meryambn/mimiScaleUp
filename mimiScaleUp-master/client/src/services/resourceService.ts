// Resource service for API communication
// Following the same pattern as programService.ts

// Define interfaces for the resource data
export interface CreateResourceRequest {
  title: string;
  description: string;
  type: string; // 'Document', 'Tableur', 'Vidéo', 'Présentation', 'Autre'
  is_external?: boolean;
  url?: string;
  category?: string;
  file?: File; // For file uploads
}

export interface CreateResourceResponse {
  id: number;
  message: string;
  filename?: string;
}

export interface Resource {
  id: number;
  title: string;
  description: string;
  type: string;
  is_external: boolean;
  file_path?: string;
  url?: string;
  created_at: string;
  program_id: number;
  category?: string;
}

export interface ExternalResource {
  id: number;
  title: string;
  url: string;
  program_id: number;
}

export interface ResourcesResponse {
  resources: Resource[];
  externalResources: ExternalResource[];
}

export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  type?: string;
  is_external?: boolean;
  url?: string;
  category?: string;
  file?: File;
}

export interface UpdateResourceResponse {
  message: string;
}

// Base URL for the API
const API_BASE_URL = "http://localhost:8083/api";

// Map frontend resource types to backend resource types
function mapResourceType(type: string): string {
  switch (type.toLowerCase()) {
    case 'document':
      return 'Document';
    case 'spreadsheet':
      return 'Tableur';
    case 'video':
      return 'Vidéo';
    case 'presentation':
      return 'Présentation';
    default:
      return 'Autre';
  }
}

/**
 * Create a new resource for a program
 * @param programId The ID of the program
 * @param resourceData The resource data to create
 * @returns A promise with the created resource ID and success message
 */
export async function createResource(programId: number | string, resourceData: CreateResourceRequest): Promise<CreateResourceResponse> {
  try {
    console.log(`Creating resource for program ${programId}:`, resourceData);

    // Check if this is explicitly marked as an external resource
    const isExternal = resourceData.is_external === true;

    if (isExternal) {
      // Handle external resource (JSON)
      const response = await fetch(`${API_BASE_URL}/resources/create/${programId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...resourceData,
          is_external: true,
          // Map the frontend type to the backend type if provided, otherwise use 'Autre'
          type: resourceData.type ? mapResourceType(resourceData.type) : 'Autre'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create external resource: ${errorText}`);
      }

      return await response.json();
    } else {
      // Handle file upload (FormData)
      const formData = new FormData();
      formData.append('title', resourceData.title);
      if (resourceData.description) formData.append('description', resourceData.description);
      // Map the frontend type to the backend type
      formData.append('type', mapResourceType(resourceData.type));
      formData.append('is_external', 'false');
      if (resourceData.category) formData.append('category', resourceData.category);
      if (resourceData.file) formData.append('file', resourceData.file);

      const response = await fetch(`${API_BASE_URL}/resources/create/${programId}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create file resource: ${errorText}`);
      }

      return await response.json();
    }
  } catch (error) {
    console.error("Error creating resource:", error);
    throw error;
  }
}

/**
 * Get all resources for a program
 * @param programId The ID of the program
 * @returns A promise with the resources data
 */
export async function getProgramResources(programId: number | string): Promise<ResourcesResponse> {
  try {
    console.log(`Getting resources for program ${programId}`);

    const response = await fetch(`${API_BASE_URL}/resources/program/${programId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get program resources: ${errorText}`);
    }

    const result = await response.json();
    console.log("Resources retrieved successfully:", result);

    // Ensure we have the expected structure
    return {
      resources: Array.isArray(result.resources) ? result.resources : [],
      externalResources: Array.isArray(result.externalResources) ? result.externalResources : []
    };
  } catch (error) {
    console.error("Error getting program resources:", error);
    return { resources: [], externalResources: [] };
  }
}

/**
 * Get a specific resource
 * @param resourceId The ID of the resource
 * @returns A promise with the resource data
 */
export async function getResource(resourceId: number | string): Promise<Resource> {
  try {
    console.log(`Getting resource ${resourceId}`);

    const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get resource: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting resource:", error);
    throw error;
  }
}

/**
 * Get the download URL for a resource
 * @param resourceId The ID of the resource
 * @returns The download URL
 */
export function getResourceDownloadUrl(resourceId: number | string): string {
  return `${API_BASE_URL}/resources/download/${resourceId}`;
}

/**
 * Update a resource
 * @param resourceId The ID of the resource
 * @param resourceData The resource data to update
 * @returns A promise with the success message
 */
export async function updateResource(resourceId: number | string, resourceData: UpdateResourceRequest): Promise<UpdateResourceResponse> {
  try {
    console.log(`Updating resource ${resourceId}:`, resourceData);

    // Check if this is explicitly marked as an external resource
    const isExternal = resourceData.is_external === true;

    if (isExternal) {
      // Handle external resource (JSON)
      const response = await fetch(`${API_BASE_URL}/resources/update/${resourceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...resourceData,
          is_external: true,
          // Map the frontend type to the backend type if provided, otherwise use 'Autre'
          type: resourceData.type ? mapResourceType(resourceData.type) : 'Autre'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update external resource: ${errorText}`);
      }

      return await response.json();
    } else {
      // Handle file upload (FormData)
      const formData = new FormData();
      if (resourceData.title) formData.append('title', resourceData.title);
      if (resourceData.description) formData.append('description', resourceData.description);
      // Map the frontend type to the backend type
      if (resourceData.type) formData.append('type', mapResourceType(resourceData.type));
      formData.append('is_external', 'false');
      if (resourceData.category) formData.append('category', resourceData.category);
      if (resourceData.file) formData.append('file', resourceData.file);

      const response = await fetch(`${API_BASE_URL}/resources/update/${resourceId}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update file resource: ${errorText}`);
      }

      return await response.json();
    }
  } catch (error) {
    console.error("Error updating resource:", error);
    throw error;
  }
}

/**
 * Delete a resource
 * @param resourceId The ID of the resource
 * @returns A promise with the success message
 */
export async function deleteResource(resourceId: number | string): Promise<{ message: string }> {
  try {
    console.log(`Deleting resource ${resourceId}`);

    // Use the standard DELETE method now that CORS is fixed
    const response = await fetch(`${API_BASE_URL}/resources/delete/${resourceId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete resource: ${errorText}`);
    }

    // Try to parse the response as JSON, but handle the case where it might be empty
    try {
      return await response.json();
    } catch (jsonError) {
      // If the response is empty or not valid JSON, return a default success message
      return { message: "Ressource supprimée avec succès" };
    }
  } catch (error) {
    console.error("Error deleting resource:", error);
    throw error;
  }
}
