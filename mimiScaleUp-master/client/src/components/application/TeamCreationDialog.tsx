import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApplicationSubmission } from './ApplicationSubmissionCard';
import { AlertCircle, Users, Info } from 'lucide-react';
import { useProgramContext } from '@/context/ProgramContext';

interface TeamCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissions: ApplicationSubmission[];
  onCreateTeam: (teamData: {
    name: string;
    description: string;
    members: ApplicationSubmission[];
  }) => void;
}

const TeamCreationDialog: React.FC<TeamCreationDialogProps> = ({
  open,
  onOpenChange,
  submissions,
  onCreateTeam
}) => {
  const { selectedProgram } = useProgramContext();
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<ApplicationSubmission[]>([]);
  const [totalMemberCount, setTotalMemberCount] = useState(0);
  const [maxTeamSize, setMaxTeamSize] = useState(5); // Default max team size

  // Get max team size from eligibility criteria
  useEffect(() => {
    if (selectedProgram?.eligibilityCriteria?.maxTeamSize) {
      setMaxTeamSize(selectedProgram.eligibilityCriteria.maxTeamSize);
    }
  }, [selectedProgram]);

  // Get all submissions that can be added to a team
  // Include both pending and any other status that should be allowed
  const pendingSubmissions = submissions.filter(s => s.status === 'pending' || s.status === 'approved');

  // Log the number of submissions available for debugging
  useEffect(() => {
    console.log(`Total submissions: ${submissions.length}, Filtered submissions: ${pendingSubmissions.length}`);
    console.log('Available teams:', pendingSubmissions.map(s => s.teamName));
  }, [submissions, pendingSubmissions]);

  const handleSelectMember = (submission: ApplicationSubmission) => {
    if (selectedMembers.some(m => m.id === submission.id)) {
      // Remove team and its members
      setSelectedMembers(selectedMembers.filter(m => m.id !== submission.id));
      // Subtract the team's member count from the total
      setTotalMemberCount(prev => prev - submission.teamSize);
    } else {
      // Check if adding this team would exceed the max team size
      const newTotalCount = totalMemberCount + submission.teamSize;
      if (newTotalCount <= maxTeamSize) {
        // Add team
        setSelectedMembers([...selectedMembers, submission]);
        // Add the team's member count to the total
        setTotalMemberCount(newTotalCount);
      } else {
        // Alert the user that adding this team would exceed the max team size
        alert(`Impossible d'ajouter ${submission.teamName} (${submission.teamSize} membre${submission.teamSize > 1 ? 's' : ''}) car cela dépasserait la taille maximale de l'équipe de ${maxTeamSize}.`);
      }
    }
  };

  const handleCreateTeam = () => {
    if (teamName.trim() === '') {
      alert('Veuillez entrer un nom d\'\u00e9quipe');
      return;
    }

    if (totalMemberCount === 0) {
      alert('Veuillez sélectionner au moins une candidature');
      return;
    }

    onCreateTeam({
      name: teamName,
      description: teamDescription,
      members: selectedMembers
    });

    // Reset form
    setTeamName('');
    setTeamDescription('');
    setSelectedMembers([]);
    onOpenChange(false);
  };

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle équipe</DialogTitle>
          <DialogDescription>
            Sélectionnez les candidatures à inclure dans votre nouvelle équipe. Chaque candidature peut représenter une équipe existante ou un participant individuel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4 flex-grow overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="team-name">Nom de l'équipe</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Entrez le nom de l'équipe"
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex-grow">
                <Label>Nombre total de membres</Label>
                <p className="text-xs text-muted-foreground mt-1">Total combiné de toutes les candidatures sélectionnées</p>
                <div className="flex items-center mt-1">
                  <Badge variant="secondary" className="mr-2">
                    <Users className="h-3 w-3 mr-1" />
                    {totalMemberCount} / {maxTeamSize}
                  </Badge>
                  {totalMemberCount === maxTeamSize && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Maximum atteint
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Taille max: {maxTeamSize}</span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="team-description">Description de l'équipe</Label>
            <Textarea
              id="team-description"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="Décrivez pourquoi cette équipe fonctionnerait bien ensemble"
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          <div className="flex-grow">
            <div className="mb-2">
              <Label>Sélectionner les candidatures</Label>
              <p className="text-sm text-muted-foreground mt-1">Lorsque vous sélectionnez une candidature ci-dessous, <strong>tous les membres</strong> seront inclus dans votre nouvelle équipe. Par exemple, sélectionner TechInnovators ajoutera ses 4 membres.</p>
            </div>
            <div className="border rounded-md p-4">
              <div className="space-y-4">
                {pendingSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune candidature en attente disponible
                  </div>
                ) : (
                  pendingSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className={`flex items-center space-x-3 p-3 rounded-md border ${
                        selectedMembers.some(m => m.id === submission.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200'
                      }`}
                    >
                      <Checkbox
                        id={`member-${submission.id}`}
                        checked={selectedMembers.some(m => m.id === submission.id)}
                        onCheckedChange={() => handleSelectMember(submission)}
                        disabled={totalMemberCount + submission.teamSize > maxTeamSize && !selectedMembers.some(m => m.id === submission.id)}
                      />
                      <div className="flex items-center flex-grow space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(submission.teamName || 'User')}&background=random`} />
                          <AvatarFallback>{getInitials(submission.teamName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <div className="font-medium">{submission.teamName || submission.teamEmail?.split('@')[0] || `Candidature ${submission.id}`}</div>
                          <div className="text-sm text-muted-foreground">{submission.industry || 'Secteur non spécifié'}</div>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge variant="outline" className="bg-primary/10 mb-1">{submission.teamSize} membre{submission.teamSize !== 1 ? 's' : ''}</Badge>
                          <span className="text-xs text-muted-foreground">{submission.teamSize > 1 ? 'Tous les membres seront ajoutés' : 'Participant individuel'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
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
            onClick={handleCreateTeam}
            disabled={totalMemberCount === 0 || teamName.trim() === ''}
            style={{
              background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: (totalMemberCount === 0 || teamName.trim() === '') ? 'not-allowed' : 'pointer',
              opacity: (totalMemberCount === 0 || teamName.trim() === '') ? '0.5' : '1'
            }}
          >
            Créer l'équipe
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamCreationDialog;
