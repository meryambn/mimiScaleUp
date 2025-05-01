import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, UserPlus, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{submission.teamName}</CardTitle>
          {getStatusBadge(submission.status)}
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
            <Button
              size="sm"
              onClick={() => onAddTeam(submission)}
              style={{
                background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
                color: 'white',
                border: 'none',
                padding: '0 8px',
                fontSize: '0.75rem',
                height: '28px',
                minWidth: '80px'
              }}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Ajouter
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ApplicationSubmissionCard;
