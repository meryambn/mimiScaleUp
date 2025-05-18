import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, Info, ArrowRight } from 'lucide-react';

interface TeamMember {
  id: string | number;
  name: string;
  role: string;
  email?: string;
  avatar?: string;
}

interface TeamInvitationNotificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  teamDescription: string;
  programName: string;
  programId?: number;
  teamMembers?: TeamMember[];
  teamReason?: string;
  onViewProgram?: () => void;
}

const TeamInvitationNotification: React.FC<TeamInvitationNotificationProps> = ({
  open,
  onOpenChange,
  teamName,
  teamDescription,
  programName,
  programId,
  teamMembers = [],
  teamReason = '',
  onViewProgram
}) => {
  // Log props for debugging
  console.log('TeamInvitationNotification props:', {
    open,
    teamName,
    teamDescription,
    programName,
    teamMembers,
    teamReason
  });
  const getInitials = (name: string | null | undefined) => {
    // Handle null or undefined names
    if (!name) {
      return '?';
    }

    try {
      return name
        .split(' ')
        .map(n => n[0] || '')
        .join('')
        .toUpperCase() || '?';
    } catch (error) {
      console.error('Error getting initials:', error);
      return '?';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-md" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2 text-primary" />
            Invitation d'équipe
          </DialogTitle>
          <DialogDescription>
            Vous avez été invité à rejoindre l'équipe "{teamName}" dans le programme "{programName}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teamName || 'Team')}&background=random`} />
              <AvatarFallback>{getInitials(teamName)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-lg">{teamName || 'Nouvelle équipe'}</h3>
              <Badge variant="outline" className="mt-1">
                {programName}
              </Badge>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md mb-4">
            <p className="text-sm">{teamDescription || 'Vous avez été ajouté à cette équipe pour collaborer sur le programme.'}</p>
          </div>

          {/* Debug teamReason */}
          {console.log('teamReason value:', teamReason, 'type:', typeof teamReason, 'truthiness:', !!teamReason)}

          <div className="mb-4">
            <h4 className="text-sm font-medium flex items-center mb-2">
              <Info className="h-4 w-4 mr-1 text-primary" />
              Pourquoi cette équipe ?
            </h4>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">{teamReason || 'Vous avez été ajouté à cette équipe pour collaborer sur le programme et combiner vos compétences avec les autres membres.'}</p>
            </div>
          </div>

          {/* Debug teamMembers */}
          {console.log('teamMembers value:', teamMembers, 'length:', teamMembers?.length, 'isArray:', Array.isArray(teamMembers))}

          <div className="mb-4">
            <h4 className="text-sm font-medium flex items-center mb-2">
              <Users className="h-4 w-4 mr-1 text-primary" />
              Membres de l'équipe
            </h4>
            <div className="space-y-2">
              {teamMembers && teamMembers.length > 0 ? (
                teamMembers.map(member => {
                  console.log('Rendering member:', member);
                  return (
                    <div key={member.id} className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                  Les informations sur les membres de l'équipe seront disponibles prochainement.
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Vous avez été ajouté à cette équipe et collaborerez avec les autres membres tout au long du programme.
          </p>
        </div>

        <DialogFooter className="flex justify-center">
          <Button
            onClick={onViewProgram}
            className="w-full"
            style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white' }}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Voir programme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamInvitationNotification;
