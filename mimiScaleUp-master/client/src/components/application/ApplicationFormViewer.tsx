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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApplicationSubmission } from './ApplicationSubmissionCard';

interface ApplicationFormViewerProps {
  submission: ApplicationSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTeam?: (submission: ApplicationSubmission) => void;
}

const ApplicationFormViewer: React.FC<ApplicationFormViewerProps> = ({
  submission,
  open,
  onOpenChange,
  onAddTeam
}) => {
  if (!submission) return null;

  const renderFormValue = (value: any) => {
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc pl-5">
          {value.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    } else if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    } else if (value === null || value === undefined) {
      return <span className="text-gray-400">Non fourni</span>;
    } else {
      return value.toString();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Candidature de {submission.teamName}</DialogTitle>
          <DialogDescription>
            Soumise le {new Date(submission.submittedAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow max-h-[60vh] overflow-y-auto pr-4" style={{ scrollbarWidth: 'thin' }}>
          <div className="space-y-6 p-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Nom de l'équipe</h3>
                <p className="mt-1">{submission.teamName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1">{submission.teamEmail}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Secteur</h3>
                <p className="mt-1">{submission.industry}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Taille de l'équipe</h3>
                <p className="mt-1">{submission.teamSize} membres</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Réponses au formulaire</h3>
              <div className="space-y-4">
                {Object.entries(submission.formData).map(([key, value]) => (
                  <div key={key} className="border-b pb-3">
                    <h4 className="text-sm font-medium text-gray-500">{key}</h4>
                    <div className="mt-1">{renderFormValue(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {submission.status === 'pending' && onAddTeam && (
            <Button
              onClick={() => {
                onAddTeam(submission);
                onOpenChange(false);
              }}
              style={{
                background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
                color: 'white',
                border: 'none'
              }}
            >
              Ajouter au programme
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationFormViewer;
