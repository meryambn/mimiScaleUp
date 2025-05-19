import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApplicationSubmission } from './ApplicationSubmissionCard';
import { addSubmissionToProgram } from '@/services/teamService';

interface AddToProgramButtonProps {
  submission: ApplicationSubmission;
  programId: string | number;
  onSuccess?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  className?: string;
}

const AddToProgramButton: React.FC<AddToProgramButtonProps> = ({
  submission,
  programId,
  onSuccess,
  variant = 'default',
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddToProgram = async () => {
    if (!programId) {
      toast({
        title: "Erreur",
        description: "Aucun programme sélectionné",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call the service to add the submission to the program
      // Pass the team name to ensure it's sent to the backend
      await addSubmissionToProgram(
        submission.id,
        programId,
        true, // assignToPhase = true
        submission.teamName !== 'utilisateur' ? submission.teamName : submission.teamEmail.split('@')[0]
      );

      // Show success message
      toast({
        title: "Soumission ajoutée",
        description: `${submission.teamName} a été ajouté avec succès au programme.`,
      });

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding submission to program:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de l'ajout de la soumission au programme. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAddToProgram}
      disabled={isLoading}
      variant={variant}
      className={className}
      style={
        variant === 'default'
          ? {
              background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
              color: 'white',
              border: 'none'
            }
          : {}
      }
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Ajout en cours...
        </>
      ) : (
        "Ajouter au programme"
      )}
    </Button>
  );
};

export default AddToProgramButton;
