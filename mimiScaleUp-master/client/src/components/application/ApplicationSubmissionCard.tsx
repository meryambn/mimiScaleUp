import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, UserPlus, Clock, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useProgramContext } from '@/context/ProgramContext';
import AddToProgramButton from './AddToProgramButton';

export interface ApplicationSubmission {
  id: number;
  programId: number | string | null;
  formId: number;
  teamName: string;
  teamEmail: string;
  teamSize: number;
  industry: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  formData: Record<string, any>;
  role?: 'startup' | 'particulier' | 'mentor' | string;
  teamInfo?: {
    id: number;
    name: string;
    type: 'team' | 'individual';
  };
}

interface ApplicationSubmissionCardProps {
  submission: ApplicationSubmission;
  onViewForm: (submission: ApplicationSubmission) => void;
  onAddTeam: (submission: ApplicationSubmission) => void;
}

const ApplicationSubmissionCard: React.FC<ApplicationSubmissionCardProps> = ({
  submission,
  onViewForm,
  onAddTeam
}) => {
  const { selectedProgramId } = useProgramContext();
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">En attente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200">Rejeté</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'startup':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Startup</Badge>;
      case 'particulier':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-200">Particulier</Badge>;
      case 'mentor':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Mentor</Badge>;
      default:
        return null;
    }
  };

  // Display actual name instead of "utilisateur"
  const displayName = submission.teamName === "utilisateur" || !submission.teamName
    ? submission.teamEmail.split('@')[0] // Use email username if no name
    : submission.teamName;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <CardTitle className="text-lg">{displayName}</CardTitle>
            <div className="flex mt-1 space-x-2">
              {getRoleBadge(submission.role)}
              {getStatusBadge(submission.status)}
            </div>
            {/* Only show team membership for actual teams */}
            {submission.status === 'approved' &&
             submission.teamInfo &&
             submission.teamInfo.type === 'team' && (
              <div className="mt-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md">
                Membre de l'équipe "{submission.teamInfo.name}"
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center mt-1">
            <Clock className="h-3 w-3 mr-1" />
            <span>Soumis il y a {formatDistanceToNow(new Date(submission.submittedAt))}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Secteur:</span>
            <span>{submission.industry}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taille de l'équipe:</span>
            <span>{submission.teamSize} membres</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Contact:</span>
            <span className="truncate max-w-[180px]">{submission.teamEmail}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewForm(submission)}
            style={{
              padding: '0 8px',
              fontSize: '0.75rem',
              height: '28px',
              minWidth: '90px'
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            Consulter
          </Button>
          {submission.status === 'pending' && (
            <div className="flex gap-1">
              {/* Bouton pour ajouter directement au programme */}
              <AddToProgramButton
                submission={submission}
                programId={selectedProgramId || ''}
                variant="default"
                className="text-xs h-7 px-2 min-w-[80px] flex items-center"
              />
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ApplicationSubmissionCard;
