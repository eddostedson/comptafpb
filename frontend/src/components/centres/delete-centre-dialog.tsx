'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface Centre {
  id: string;
  code: string;
  nom: string;
}

interface DeleteCentreDialogProps {
  centre: Centre | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteCentreDialog({
  centre,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteCentreDialogProps) {
  if (!centre) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmer la suppression
          </DialogTitle>
          <div className="text-sm text-muted-foreground pt-2 space-y-2">
            <div>
              Êtes-vous sûr de vouloir supprimer le centre{' '}
              <strong className="text-foreground">{centre.nom}</strong> ({centre.code}) ?
            </div>
            <div className="text-muted-foreground text-xs bg-muted/50 p-2 rounded border">
              ⚠️ <strong>Attention :</strong> Cette action est irréversible. Si le centre contient des utilisateurs ou budgets, la suppression sera automatiquement bloquée pour protéger vos données.
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
                Suppression...
              </>
            ) : (
              'Supprimer définitivement'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

