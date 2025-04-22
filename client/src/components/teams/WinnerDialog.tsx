import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WinnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  programName: string;
}

const WinnerDialog: React.FC<WinnerDialogProps> = ({
  open,
  onOpenChange,
  teamName,
  programName
}) => {
  // Lancer des confettis lorsque le dialogue s'ouvre
  React.useEffect(() => {
    if (open) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-amber-100 p-4 rounded-full">
              <Trophy className="h-12 w-12 text-amber-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Félicitations!</DialogTitle>
          <DialogDescription className="text-center">
            <p className="text-lg font-semibold mt-2 text-amber-600">
              {teamName}
            </p>
            <p className="mt-2">
              a été sélectionné comme gagnant du programme
            </p>
            <p className="text-lg font-semibold mt-1 mb-2">
              {programName}
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="bg-amber-50 p-4 rounded-md my-4">
          <p className="text-sm text-amber-800">
            Cette équipe sera mise en avant dans le tableau de bord du programme et recevra un badge spécial "Gagnant" sur sa page de profil.
          </p>
        </div>
        <DialogFooter className="sm:justify-center">
          <button
            onClick={() => onOpenChange(false)}
            style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
          >
            <Trophy className="h-4 w-4 mr-2" />
            Fermer
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerDialog;
