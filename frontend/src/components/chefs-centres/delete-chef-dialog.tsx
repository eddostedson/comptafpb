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

interface Chef {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
}

interface DeleteChefDialogProps {
  chef: Chef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteChefDialog({
  chef,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteChefDialogProps) {
  if (!chef) return null;

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
              Êtes-vous sûr de vouloir supprimer le chef de centre{' '}
              <strong className="text-foreground">{chef.prenom} {chef.nom}</strong> ({chef.code}) ?
            </div>
            <div className="text-muted-foreground text-xs bg-muted/50 p-2 rounded border">
              ⚠️ <strong>Attention :</strong> Cette action est irréversible. Si le chef a créé des budgets, la suppression sera automatiquement bloquée pour protéger vos données.
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

