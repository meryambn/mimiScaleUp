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
import { Check, X, Mail } from 'lucide-react';

interface TeamInvitationNotificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  teamDescription: string;
  programName: string;
  onAccept: () => void;
  onDecline: () => void;
}

const TeamInvitationNotification: React.FC<TeamInvitationNotificationProps> = ({
  open,
  onOpenChange,
  teamName,
  teamDescription,
  programName,
  onAccept,
  onDecline
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2 text-primary" />
            Team Invitation
          </DialogTitle>
          <DialogDescription>
            You've been invited to join a team
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=random`} />
              <AvatarFallback>{getInitials(teamName)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-lg">{teamName}</h3>
              <Badge variant="outline" className="mt-1">
                {programName}
              </Badge>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md mb-4">
            <p className="text-sm">{teamDescription}</p>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            By accepting this invitation, you'll be added to this team and will collaborate with other team members throughout the program.
          </p>
        </div>

        <DialogFooter className="flex space-x-2 sm:space-x-0">
          <Button variant="outline" onClick={onDecline} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Decline
          </Button>
          <Button onClick={onAccept} className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamInvitationNotification;
