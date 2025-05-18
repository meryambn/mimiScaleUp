/**
 * Utility functions for mapping between frontend and backend program status values
 */

// Frontend status types
export type FrontendStatus = 'draft' | 'active' | 'completed';
// Backend status types - using string to allow for more flexibility
export type BackendStatus = string; // Includes 'Brouillon', 'Actif', 'Terminé' and variations
// Template status types
export type TemplateStatus = 'Modèle' | 'Non-Modèle';

// Map frontend status to backend status
export function mapToBackendStatus(status: FrontendStatus): BackendStatus {
  const statusMap: Record<FrontendStatus, BackendStatus> = {
    'draft': 'Brouillon',
    'active': 'Actif',
    'completed': 'Terminé'
  };

  // Return the mapped status or default to 'Actif' if not found
  return statusMap[status] || 'Actif';
}

// Map backend status to frontend status
export function mapToFrontendStatus(status: BackendStatus): FrontendStatus {
  // First try exact match
  const statusMap: Record<BackendStatus, FrontendStatus> = {
    'Brouillon': 'draft',
    'Actif': 'active',
    'Terminé': 'completed'
  };

  if (statusMap[status]) {
    return statusMap[status];
  }

  // If no exact match, try case-insensitive match
  const statusLower = status.toLowerCase();
  if (statusLower.includes('brouillon')) {
    return 'draft';
  } else if (statusLower.includes('actif')) {
    return 'active';
  } else if (statusLower.includes('terminé') || statusLower.includes('termine')) {
    return 'completed';
  }

  // Default to active if no match
  console.warn(`Unknown status: ${status}, defaulting to 'active'`);
  return 'active';
}

// Get display text for a status (in French)
export function getStatusDisplayText(status: FrontendStatus): string {
  const displayMap: Record<FrontendStatus, string> = {
    'draft': 'Brouillon',
    'active': 'Actif',
    'completed': 'Terminé'
  };
  return displayMap[status];
}
