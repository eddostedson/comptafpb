'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

interface CentreToDissociate {
  id: string;
  code: string;
  nom: string;
}

interface DissocierCentreDialogProps {
  centre: CentreToDissociate | null;
  regisseurNom: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DissocierCentreDialog({
  centre,
  regisseurNom,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DissocierCentreDialogProps) {
  if (!centre) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            Dissocier le centre
          </DialogTitle>
          <div className="text-sm text-muted-foreground pt-2 space-y-2">
            <div>
              Êtes-vous sûr de vouloir dissocier le centre{' '}
              <strong className="text-foreground">{centre.code} - {centre.nom}</strong>
              du régisseur <strong className="text-foreground">{regisseurNom}</strong> ?
            </div>
            <div className="text-muted-foreground text-xs bg-muted/50 p-2 rounded border">
              Cette action retirera l'association du centre avec le régisseur. Le centre ne sera pas supprimé.
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dissociation...
              </>
            ) : (
              'Confirmer la dissociation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


