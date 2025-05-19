import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DeliverableSubmission, downloadSubmissionFile, updateSubmissionStatus } from '@/services/deliverableService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DeliverableSubmissionCardProps {
  submission: DeliverableSubmission;
  livrableName: string;
  onStatusUpdate: () => void;
  isAdmin: boolean;
}

export const DeliverableSubmissionCard: React.FC<DeliverableSubmissionCardProps> = ({
  submission,
  livrableName,
  onStatusUpdate,
  isAdmin
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Debug the submission data
  console.log('DeliverableSubmissionCard - submission:', submission);
  console.log('DeliverableSubmissionCard - livrableName:', livrableName);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'valide':
        return 'bg-green-100 text-green-800';
      case 'rejete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'en attente':
        return 'En attente';
      case 'valide':
        return 'Validé';
      case 'rejete':
        return 'Rejeté';
      default:
        return status;
    }
  };

  const handleDownload = () => {
    downloadSubmissionFile(submission.id.toString());
  };

  const handleStatusUpdate = async (newStatus: 'valide' | 'rejete') => {
    try {
      setIsUpdating(true);
      await updateSubmissionStatus(submission.id.toString(), newStatus);
      toast({
        title: "Statut mis à jour",
        description: `Le livrable a été marqué comme ${newStatus === 'valide' ? 'validé' : 'rejeté'}.`,
        variant: newStatus === 'valide' ? "default" : "destructive",
      });
      onStatusUpdate();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut.",
        variant: "destructive",
      });
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{livrableName}</CardTitle>
          <p className="text-sm text-gray-500">
            Soumis le {formatDate(submission.date_soumission)}
          </p>
        </div>
        <Badge className={getStatusColor(submission.statut)}>
          {getStatusText(submission.statut)}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center text-sm">
            <span className="font-medium mr-2">Fichier:</span>
            <span className="text-gray-700">{submission.nom_fichier}</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </Button>

            {isAdmin && submission.statut === 'en attente' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('valide')}
                  disabled={isUpdating}
                  className="flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
                >
                  <CheckCircle className="h-4 w-4" />
                  Valider
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('rejete')}
                  disabled={isUpdating}
                  className="flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter
                </Button>
              </>
            )}

            {submission.statut === 'en attente' && (
              <div className="flex items-center text-yellow-600 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                En attente de validation
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliverableSubmissionCard;
